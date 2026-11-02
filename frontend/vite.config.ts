import { defineConfig } from 'vite';
export default defineConfig({ server: { proxy: { '/api': 'http://localhost:4000', '/errors': 'http://localhost:4000' } } });
