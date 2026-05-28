export const MAX_UPLOAD_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const UPLOAD_SIZE_NOTE = `Maximum file size: ${MAX_UPLOAD_SIZE_MB}MB.`;

export const getFileSizeError = (file) => {
    if (!file || file.size <= MAX_UPLOAD_SIZE_BYTES) {
        return '';
    }

    return `${file.name} is too large. Maximum file size is ${MAX_UPLOAD_SIZE_MB}MB.`;
};

export const getFilesSizeError = (files = []) => {
    const oversized = Array.from(files).find((file) => getFileSizeError(file));
    return oversized ? getFileSizeError(oversized) : '';
};
