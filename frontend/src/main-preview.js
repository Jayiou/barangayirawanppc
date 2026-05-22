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
    const params = new URLSearchParams(globalThis.location.search);
    return params.get('documentId');
};

const openPdf = async () => {
    renderError('Document preview is no longer available.');
};

renderLoading();
openPdf();