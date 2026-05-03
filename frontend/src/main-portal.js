import { createApp } from 'vue';
import PortalApp from './pages/PortalApp.vue';
import './styles.css';

try {
	createApp(PortalApp).mount('#app');
	globalThis.__APP_MOUNTED = true;
} catch (error) {
	document.body.style.margin = '0';
	document.body.style.padding = '20px';
	document.body.style.fontFamily = 'Arial, sans-serif';
	document.body.style.backgroundColor = '#fee';
	document.body.innerHTML = `
		<div style="max-width: 600px; margin: 50px auto; padding: 20px; background: white; border: 2px solid red; border-radius: 8px;">
			<h1 style="color: red; margin-top: 0;">⚠️ Portal App Initialization Error</h1>
			<p><strong>Error:</strong> ${error.message}</p>
			<pre style="background: #f5f5f5; padding: 10px; overflow-x: auto; font-size: 12px;">${error.stack || ''}</pre>
		</div>
	`;
}
