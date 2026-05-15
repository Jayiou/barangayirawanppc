const path = require('node:path');
const { defineConfig } = require('vite');
const vue = require('@vitejs/plugin-vue');
const legacy = require('@vitejs/plugin-legacy').default;

module.exports = defineConfig({
    plugins: [
        vue(),
        legacy({
            targets: ['defaults', 'iOS >= 11', 'Safari >= 11'],
            modernTargets: ['iOS >= 11', 'Safari >= 11'],
            modernPolyfills: true,
            renderLegacyChunks: true
        })
    ],
    root: __dirname,
    publicDir: 'public',
    envDir: path.resolve(__dirname, '..'),
    build: {
        outDir: path.resolve(__dirname, '../frontend-dist'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
                portal: path.resolve(__dirname, 'portal.html'),
                admin: path.resolve(__dirname, 'admin.html'),
                preview: path.resolve(__dirname, 'preview.html')
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    }
});
