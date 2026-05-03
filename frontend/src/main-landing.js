// Log immediately when script loads (before imports complete)
if (typeof console !== 'undefined') {
    console.log('[main-landing.js] ⚡ Module script started executing');
}
globalThis.__APP_MODULE_STARTED = true;
if (typeof globalThis.__setBootStatus === 'function') {
    globalThis.__setBootStatus('Boot: main-landing module started');
}

import { createApp } from 'vue';
import LandingApp from './pages/LandingApp.vue';
import './styles.css';

// Diagnostic logging
const log = (msg, data = '') => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    console.log(`[${timestamp}] [main-landing.js] ${msg}`, data);
};

const error = (msg, err = '') => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`[${timestamp}] [main-landing.js] ❌ ${msg}`, err);
};

log('📍 Imports completed, checking DOM readyState');
log('Current readyState:', document.readyState);

// Check if DOM is ready
if (document.readyState === 'loading') {
    log('📍 Document still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    log('📍 Document already ready, initializing app');
    initApp();
}

function initApp() {
    try {
        log('🔧 Checking #app element');
        const appElement = document.getElementById('app');
        if (!appElement) {
            throw new Error('#app element not found in DOM');
        }
        log('✓ #app element found', { display: appElement.style.display, offsetHeight: appElement.offsetHeight });
        
        log('🔧 Creating Vue app instance');
        const app = createApp(LandingApp);
        log('✓ Vue app instance created');
        
        log('🔧 Mounting app to #app');
        app.mount('#app');
        globalThis.__APP_MOUNTED = true;
        if (typeof globalThis.__setBootStatus === 'function') {
            globalThis.__setBootStatus('Boot: Vue app mounted');
        }
        log('✓ App mounted successfully');
        log('✓ App instance lifecycle started');
        
    } catch (err) {
        if (typeof globalThis.__setBootStatus === 'function') {
            globalThis.__setBootStatus(`Boot: init failed - ${err.message}`);
        }
        error('App initialization failed', err.message);
        error('Stack:', err.stack);
        
        // Show visible error on screen
        document.body.style.margin = '0';
        document.body.style.padding = '20px';
        document.body.style.fontFamily = 'Arial, sans-serif';
        document.body.style.backgroundColor = '#fee';
        document.body.innerHTML = `
            <div style="max-width: 600px; margin: 50px auto; padding: 20px; background: white; border: 2px solid red; border-radius: 8px;">
                <h1 style="color: red; margin-top: 0;">⚠️ App Initialization Error</h1>
                <p><strong>Error:</strong> ${err.message}</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto; font-size: 12px;">${err.stack}</pre>
                <p style="font-size: 12px; color: #666;">
                    If you continue seeing this error, please:
                    <br/>1. Try refreshing the page (Ctrl+Shift+R on desktop, or swipe down to refresh on mobile)
                    <br/>2. Clear browser cache
                    <br/>3. Try a different browser
                </p>
            </div>
        `;
    }
}

