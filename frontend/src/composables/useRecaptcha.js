import { ref } from 'vue';

const pollForGrecaptcha = (onReady, onTimeout) => {
    const checkGrecaptcha = setInterval(() => {
        if (globalThis.grecaptcha?.render) {
            clearInterval(checkGrecaptcha);
            onReady();
        }
    }, 250);
    setTimeout(() => {
        clearInterval(checkGrecaptcha);
        onTimeout();
    }, 15000);
};

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
                if (globalThis.grecaptcha?.render) {
                    resolve();
                    return;
                }

                // Check if script is already being loaded
                if (document.querySelector('script[src*="recaptcha"]')) {
                    // Wait for grecaptcha to be available
                    const checkGrecaptcha = setInterval(() => {
                        if (globalThis.grecaptcha?.render) {
                            clearInterval(checkGrecaptcha);
                            resolve();
                        }
                    }, 100);
                    setTimeout(() => {
                        clearInterval(checkGrecaptcha);
                        resetLoaderState();
                        setRecaptchaError('reCAPTCHA failed to load. Please refresh the page and try again.');
                        reject(new Error('reCaptcha failed to load'));
                    }, 15000);
                    return;
                }

                // Setup explicit callback for recaptcha
                const callbackName = 'onRecaptchaLoadCallback_' + Math.random().toString(36).substring(2, 9);
                globalThis[callbackName] = () => {
                    // Callback fired by Google when fully ready
                    if (globalThis.grecaptcha?.render) {
                        resolve();
                    }
                };

                const onPollReady = () => {
                    resetLoaderState();
                    resolve();
                };
                const onPollTimeout = () => {
                    resetLoaderState();
                    setRecaptchaError('reCAPTCHA did not finish loading. Please check your connection or turn off adblockers and try again.');
                    reject(new Error('reCaptcha object not available'));
                };

                // Load the reCaptcha script
                const script = document.createElement('script');
                script.src = `https://www.google.com/recaptcha/api.js?onload=${callbackName}&render=explicit`;
                script.async = true;
                script.defer = true;

                script.onload = () => pollForGrecaptcha(onPollReady, onPollTimeout);

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
            if (globalThis.grecaptcha?.render) {
                if (recaptchaWidgetId !== null && container.dataset.rendered === 'true') {
                    globalThis.grecaptcha.reset(recaptchaWidgetId);
                    recaptchaReady.value = true;
                    return;
                }

                container.innerHTML = '';
                delete container.dataset.rendered;
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

    const cleanupRecaptchaWidget = () => {
        const container = document.getElementById('g-recaptcha');
        if (container) {
            delete container.dataset.rendered;
            container.innerHTML = '';
        }

        recaptchaWidgetId = null;
        recaptchaReady.value = false;
        clearRecaptchaError();

        if (recaptchaRenderTimer) {
            clearTimeout(recaptchaRenderTimer);
            recaptchaRenderTimer = null;
        }
    };

    return {
        recaptchaSiteKey, recaptchaReady, recaptchaError,
        ensureRecaptchaReady, renderRecaptchaCheckbox, getRecaptchaToken, resetRecaptcha, cleanupRecaptchaWidget
    };
}
