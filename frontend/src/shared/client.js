export const STORAGE_KEYS = {
    token: 'barangayToken',
    user: 'barangayUser'
};

export const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const getAuth = () => ({
    token: localStorage.getItem(STORAGE_KEYS.token) || '',
    user: JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null')
});

export const setAuth = (token, user) => {
    localStorage.setItem(STORAGE_KEYS.token, token || '');
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user || null));
};

export const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
};

export const apiFetch = async (path, options = {}) => {
    const auth = getAuth();
    
    // Only set Content-Type if body is not FormData
    // FormData should let the browser set the Content-Type with boundary
    const headers = { ...options.headers };

    // Ensure body is JSON string when a plain object is passed
    if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
        options.body = JSON.stringify(options.body);
    }

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (auth.token) {
        headers.Authorization = `Bearer ${auth.token}`;
    }

    // Build URL but avoid doubling the '/api' prefix when callers already include it.
    const url = String(path || '').startsWith('/api') ? path : ('/api' + (String(path).startsWith('/') ? path : '/' + String(path)));

    let response;
    try {
        response = await fetch(url, { ...options, headers });
    } catch {
        const error = new Error('Cannot connect to the server. Please check your connection and try again.');
        error.status = 0;
        error.code = 'NETWORK_ERROR';
        throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
        // If token is invalid/expired, clear local auth so UI can re-login
        if (response.status === 401) {
            try { clearAuth(); } catch (e) { /* ignore */ }
        }

        const error = new Error(typeof payload === 'object' && payload?.message ? payload.message : 'Request failed');
        error.status = response.status;
        error.code = typeof payload === 'object' && payload?.code ? payload.code : '';
        throw error;
    }

    return payload;
};

export const normalizeText = (value) => String(value || '').toLowerCase();

export const formatDate = (value) => {
    if (!value) {
        return 'No date';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

export const formatDateTime = (value) => {
    if (!value) {
        return 'No date';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};
