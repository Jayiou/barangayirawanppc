require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sanitize = require('mongo-sanitize');
const path = require('node:path');
const fs = require('node:fs');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Security Headers
// For local development on HTTP/IP, we need to disable some strict HTTPS-only features
app.use(helmet({
    contentSecurityPolicy: false, 
    hsts: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    permissionsPolicy: {
        features: {
            geolocation: ['self']
        }
    }
}));

// Trust first proxy (useful for rate limiting if behind Heroku, Nginx, etc.)
app.set('trust proxy', 1);

const frontendDirectory = path.join(__dirname, 'frontend-dist');
const defaultCorsOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];
const normalizeOrigin = (value) => {
    if (!value) {
        return null;
    }

    try {
        return new URL(value).origin;
    } catch {
        return String(value).trim();
    }
};

const configuredCorsOrigins = [
    process.env.CORS_ORIGINS,
    process.env.APP_URL,
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.PUBLIC_URL
]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

const allowedCorsOrigins = new Set(
    [...defaultCorsOrigins, ...configuredCorsOrigins]
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean)
);

const isPrivateNetworkHost = (hostname) => {
    if (!hostname) {
        return false;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return true;
    }

    // In production, we might want to disable this liberal private network check
    if (process.env.NODE_ENV === 'production') {
        return false;
    }

    if (hostname.endsWith('.local')) {
        return true;
    }

    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!ipv4Match) {
        return false;
    }

    const octets = ipv4Match.slice(1).map(Number);
    if (octets.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
        return false;
    }

    const [first, second] = octets;
    if (first === 10) return true;
    if (first === 127) return true;
    if (first === 192 && second === 168) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;

    return false;
};

const isDevelopmentTunnelHost = (hostname) => {
    if (!hostname || process.env.NODE_ENV === 'production') {
        return false;
    }

    const defaultTunnelSuffixes = [
        'trycloudflare.com',
        'ngrok-free.app',
        'loca.lt',
        'localto.net'
    ];
    const configuredSuffixes = String(process.env.DEV_TUNNEL_HOSTS || '')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    const suffixes = [...defaultTunnelSuffixes, ...configuredSuffixes];
    const lowerHost = String(hostname).toLowerCase();

    return suffixes.some((suffix) => lowerHost === suffix || lowerHost.endsWith(`.${suffix}`));
};

app.use(express.json());

// Register status actions routes
try {
    app.use('/api/actions', require('./routes/statusActionsRoutes'));
} catch (err) {
    console.error('ERROR loading status actions routes:', err.message);
}

// NoSQL Injection Protection
app.use((req, res, next) => {
    sanitize(req.body);
    sanitize(req.params);
    sanitize(req.query);
    next();
});
app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/' || req.path === '/portal' || req.path === '/admin') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// Serve static frontend assets before CORS so asset requests are not blocked by origin checks
app.use(express.static(frontendDirectory, {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));
app.use('/uploads/:filename', (req, res, next) => {
    if (req.params.filename.startsWith('proofOfResidency-')) {
        return res.status(403).json({
            success: false,
            message: 'Proof of residency files are private'
        });
    }

    return next();
});
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(cors({
    origin(origin, callback) {
        // Allow requests without origin (same-origin requests like from static frontend)
        // or if origin is in the allowlist
        if (!origin || allowedCorsOrigins.has(origin)) {
            return callback(null, true);
        }

        try {
            const { hostname } = new URL(origin);
            if (isPrivateNetworkHost(hostname)) {
                return callback(null, true);
            }

            if (isDevelopmentTunnelHost(hostname)) {
                return callback(null, true);
            }
        } catch {
            // Fall through to rejection below.
        }

        const error = new Error('Not allowed by CORS');
        error.statusCode = 403;
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(error);
    },
    credentials: true
}));

// Ignore favicon requests to prevent 404 errors in the console
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/residents', require('./routes/residentRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
try {
    app.use('/api/announcements', require('./routes/announcementRoutes'));
} catch (err) {
    console.error('ERROR loading announcement routes:', err);
}
app.use('/api/document-requests', require('./routes/documentRequestRoutes'));
app.use('/api/facility-reservations', require('./routes/facilityReservationRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/sms-logs', require('./routes/smsRoutes'));
    app.use('/api/blotters', require('./routes/blotterRoutes'));
    app.use('/api/manpower-requests', require('./routes/manpowerRequestRoutes'));
app.use('/api/status-audit', require('./routes/statusAuditRoutes'));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDirectory, 'index.html'));
});

app.get('/portal', (req, res) => {
    res.sendFile(path.join(frontendDirectory, 'portal.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(frontendDirectory, 'admin.html'));
});

app.use(errorHandler);

module.exports = app;
