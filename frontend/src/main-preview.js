const root = document.getElementById('preview-root');

const renderLoading = () => {
    root.innerHTML = `
        <div class="preview-card">
            <div class="spinner" aria-hidden="true"></div>
            <h1 class="preview-title">Preparing document preview</h1>
            <p class="preview-copy">Generating the PDF and opening it here automatically.</p>
        </div>
    `;
};

const renderError = (message) => {
    root.innerHTML = `
        <div class="preview-card">
            <h1 class="preview-title">Unable to open preview</h1>
            <p class="preview-copy">${message}</p>
            <div class="error-box">${message}</div>
        </div>
    `;
};

const getDocumentId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('documentId');
};

const openPdf = async () => {
    const documentId = getDocumentId();
    if (!documentId) {
        renderError('Missing document ID in preview URL.');
        return;
    }

    const token = localStorage.getItem('barangayToken') || '';
    if (!token) {
        renderError('Session expired. Please log in again, then try Preview PDF.');
        return;
    }

    try {
        const response = await fetch(`/api/document-requests/${encodeURIComponent(documentId)}/preview-document`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            let payload = null;
            try {
                payload = await response.json();
            } catch (error) {
                // Ignore JSON parse failures and use the HTTP status instead.
            }

            const serverMsg = (payload && (payload.message || payload.error || String(payload))) || response.statusText || 'Failed to fetch document';
            throw new Error(serverMsg);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        window.location.replace(blobUrl);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
        renderError(error.message || 'Failed to load preview.');
        console.error('Preview page error:', error);
    }
};

renderLoading();
openPdf();