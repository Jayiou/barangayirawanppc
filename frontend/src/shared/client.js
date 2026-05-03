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
    
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (auth.token) {
        headers.Authorization = `Bearer ${auth.token}`;
    }

    let response;
    try {
        response = await fetch(`/api${path}`, { ...options, headers });
    } catch {
        const error = new Error('Cannot connect to the server. Please check your connection and try again.');
        error.status = 0;
        error.code = 'NETWORK_ERROR';
        throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
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
