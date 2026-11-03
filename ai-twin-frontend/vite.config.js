import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const target = env.API_PROXY_TARGET || 'http://localhost:8080';
  return {
    plugins: [react()],
    server: { proxy: { '/api': target, '/auth': target } },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const path = id.replaceAll('\\', '/');
            if (
              /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(path)
            )
              return 'react';
            if (/node_modules\/(@mui|@emotion)\//.test(path)) return 'ui';
            if (path.includes('node_modules/@tanstack/')) return 'query';
            if (
              /node_modules\/(react-markdown|remark-|micromark|mdast-|hast-|unified|unist-)/.test(
                path,
              )
            )
              return 'markdown';
          },
        },
      },
    },
  };
});
