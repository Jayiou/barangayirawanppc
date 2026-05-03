import { ref } from 'vue';

export function useRecaptcha() {
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    const recaptchaReady = ref(false);
    const recaptchaError = ref('');
    let recaptchaPromise = null;
    let recaptchaWidgetId = null;
    let recaptchaRenderTimer = null;

    const clearRecaptchaError = () => {
        recaptchaError.value = '';
    };

    const setRecaptchaError = (message) => {
        recaptchaReady.value = false;
        recaptchaError.value = message;
    };

    const ensureRecaptchaReady = () => {
        if (!recaptchaPromise) {
            recaptchaPromise = new Promise((resolve, reject) => {
                const resetLoaderState = () => {
                    recaptchaPromise = null;
                };

                clearRecaptchaError();

                // Check if already loaded
                if (globalThis.grecaptcha) {
                    resolve();
                    return;
                }

                // Check if script is already being loaded
                if (document.querySelector('script[src*="recaptcha"]')) {
                    // Wait for grecaptcha to be available
                    const checkGrecaptcha = setInterval(() => {
                        if (globalThis.grecaptcha) {
                            clearInterval(checkGrecaptcha);
                            resolve();
                        }
                    }, 100);
                    setTimeout(() => {
                        clearInterval(checkGrecaptcha);
                        resetLoaderState();
                        setRecaptchaError('reCAPTCHA failed to load. Please refresh the page and try again.');
                        reject(new Error('reCaptcha failed to load'));
                    }, 10000);
                    return;
                }

                // Load the reCaptcha script
                const script = document.createElement('script');
                script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
                script.async = true;
                script.defer = true;

                script.onload = () => {
                    // Wait for grecaptcha object to be available
                    const checkGrecaptcha = setInterval(() => {
                        if (globalThis.grecaptcha && globalThis.grecaptcha.render) {
                            clearInterval(checkGrecaptcha);
                            resolve();
                        }
                    }, 100);
                    setTimeout(() => {
                        clearInterval(checkGrecaptcha);
                        resetLoaderState();
                        setRecaptchaError('reCAPTCHA did not finish loading. Please refresh the page and try again.');
                        reject(new Error('reCaptcha object not available'));
                    }, 5000);
                };

                script.onerror = () => {
                    resetLoaderState();
                    setRecaptchaError('Failed to load reCAPTCHA script. Please check your connection and try again.');
                    reject(new Error('Failed to load reCaptcha script'));
                };

                document.head.appendChild(script);
            });
        }
        return recaptchaPromise;
    };

    const renderRecaptchaCheckbox = () => {
        const container = document.getElementById('g-recaptcha');
        if (!container) return;

        if (!recaptchaSiteKey) {
            console.warn('VITE_RECAPTCHA_SITE_KEY is not set.');
            setRecaptchaError('reCAPTCHA is not configured on this site.');
            return;
        }

        try {
            if (globalThis.grecaptcha && globalThis.grecaptcha.render) {
                if (recaptchaWidgetId !== null) {
                    globalThis.grecaptcha.reset(recaptchaWidgetId);
                    recaptchaReady.value = true;
                    return;
                }

                if (container.dataset.rendered === 'true') {
                    return;
                }

                container.innerHTML = '';
                recaptchaWidgetId = globalThis.grecaptcha.render('g-recaptcha', {
                    sitekey: recaptchaSiteKey,
                    theme: 'light'
                });
                container.dataset.rendered = 'true';
                recaptchaReady.value = true;
                clearRecaptchaError();
            } else {
                console.warn('grecaptcha not available yet, retrying...');
                recaptchaReady.value = false;
                if (!recaptchaRenderTimer) {
                    recaptchaRenderTimer = setTimeout(() => {
                        recaptchaRenderTimer = null;
                        renderRecaptchaCheckbox();
                    }, 500);
                }
            }
        } catch (error) {
            console.error('reCaptcha render error:', error);
            setRecaptchaError('reCAPTCHA failed to initialize. Please refresh the page and try again.');
        }
    };

    const getRecaptchaToken = () => {
        return globalThis.grecaptcha?.getResponse?.() || null;
    };

    const resetRecaptcha = () => {
        if (globalThis.grecaptcha?.reset) {
            globalThis.grecaptcha.reset();
        }
    };

    const cleanup = () => {
        if (recaptchaRenderTimer) {
            clearTimeout(recaptchaRenderTimer);
            recaptchaRenderTimer = null;
        }
    };

    return {
        recaptchaSiteKey, recaptchaReady, recaptchaError,
        ensureRecaptchaReady, renderRecaptchaCheckbox, getRecaptchaToken, resetRecaptcha, cleanup
    };
}
