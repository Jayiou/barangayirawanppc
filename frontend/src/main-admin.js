import { createApp } from 'vue';
import AdminApp from './pages/AdminApp.vue';
import i18n from './i18n';
import { useTheme } from './composables/useTheme';
import './styles.css';
import './theme.css';

try {
	const app = createApp(AdminApp);
	
	// Initialize theme
	useTheme();
	
	// Use i18n
	app.use(i18n);
	
	app.mount('#app');
	globalThis.__APP_MOUNTED = true;
} catch (error) {
	document.body.style.margin = '0';
	document.body.style.padding = '20px';
	document.body.style.fontFamily = 'Arial, sans-serif';
	document.body.style.backgroundColor = '#fee';
	document.body.innerHTML = `
		<div style="max-width: 600px; margin: 50px auto; padding: 20px; background: white; border: 2px solid red; border-radius: 8px;">
			<h1 style="color: red; margin-top: 0;">⚠️ Admin App Initialization Error</h1>
			<p><strong>Error:</strong> ${error.message}</p>
			<pre style="background: #f5f5f5; padding: 10px; overflow-x: auto; font-size: 12px;">${error.stack || ''}</pre>
		</div>
	`;
}
