globalThis.__APP_MODULE_STARTED = true;
if (typeof globalThis.__setBootStatus === 'function') {
    globalThis.__setBootStatus('Boot: main-landing module started');
}

import { createApp } from 'vue';
import LandingApp from './pages/LandingApp.vue';
import i18n from './i18n';
import { useTheme } from './composables/useTheme';
import './styles.css';
import './theme.css';

const reportError = (message, error = '') => {
    console.error(`[main-landing.js] ${message}`, error);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    try {
        const appElement = document.getElementById('app');
        if (!appElement) {
            throw new Error('#app element not found in DOM');
        }

        // Initialize theme
        useTheme();

        const app = createApp(LandingApp);
        
        // Use i18n
        app.use(i18n);
        
        app.mount('#app');
        globalThis.__APP_MOUNTED = true;

        if (typeof globalThis.__setBootStatus === 'function') {
            globalThis.__setBootStatus('Boot: Vue app mounted');
        }
    } catch (error) {
        if (typeof globalThis.__setBootStatus === 'function') {
            globalThis.__setBootStatus(`Boot: init failed - ${error.message}`);
        }

        reportError('App initialization failed', error.message);
        reportError('Stack:', error.stack);

        document.body.style.margin = '0';
        document.body.style.padding = '20px';
        document.body.style.fontFamily = 'Arial, sans-serif';
        document.body.style.backgroundColor = '#fee';
        document.body.innerHTML = `
            <div style="max-width: 600px; margin: 50px auto; padding: 20px; background: white; border: 2px solid red; border-radius: 8px;">
                <h1 style="color: red; margin-top: 0;">App Initialization Error</h1>
                <p><strong>Error:</strong> ${error.message}</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto; font-size: 12px;">${error.stack}</pre>
                <p style="font-size: 12px; color: #666;">
                    If you continue seeing this error, please refresh the page, clear the browser cache, or try a different browser.
                </p>
            </div>
        `;
    }
}
