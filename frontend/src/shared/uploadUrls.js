export const resolvePublicUploadUrl = (value) => {
    const rawValue = String(value || '').trim().replaceAll('\\', '/');

    if (!rawValue) {
        return '';
    }

    if (/^https?:\/\//i.test(rawValue) || rawValue.startsWith('data:') || rawValue.startsWith('blob:')) {
        return rawValue;
    }

    if (rawValue.startsWith('/uploads/')) {
        return rawValue;
    }

    if (rawValue.startsWith('uploads/')) {
        return `/${rawValue}`;
    }

    if (rawValue.startsWith('/public/uploads/')) {
        return rawValue.replace(/^\/public\//, '/');
    }

    if (rawValue.startsWith('public/uploads/')) {
        return `/${rawValue.replace(/^public\//, '')}`;
    }

    const filename = rawValue.split('?')[0].split('#')[0].split('/').pop();
    return filename ? `/uploads/${encodeURI(filename)}` : '';
};