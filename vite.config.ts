import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			workbox: {
				globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff,woff2}']
			},
			manifest: {
				name: 'Catan Timer',
				short_name: 'Catan',
				description: 'Board game turn timer for Catan',
				theme_color: '#1f2937',
				background_color: '#0f172a',
				display: 'standalone',
				start_url: '/',
				scope: '/',
				icons: [
					{
						src: '/favicon.svg',
						sizes: '192x192 512x512',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					}
				]
			}
		})
	]
});
