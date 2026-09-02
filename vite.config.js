import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    host: true,
    port: 3000,
    allowedHosts: true,
    proxy: {
      // Proxy OpenCode API requests
      '/session': {
        target: 'http://localhost:4096',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/event': {
        target: 'http://localhost:4096',
        changeOrigin: true,
        ws: true
      },
      '/doc': {
        target: 'http://localhost:4096',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});