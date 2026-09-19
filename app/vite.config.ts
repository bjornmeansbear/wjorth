import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Wjorth is local-only and needs real filesystem access (CSV inbox
			// scan, JSON state file) — adapter-node runs as a standalone Node
			// server, unlike adapter-cloudflare/static which can't touch the disk.
			adapter: adapter()
		})
	]
});
