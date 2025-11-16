import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [react()],
      define: {
        'process.env.DEFAULT_SERVER_API_URL': JSON.stringify(env.DEFAULT_SERVER_API_URL),
        'process.env.SERVER_API_URLS': JSON.stringify(env.SERVER_API_URLS),
        'process.env.K1': JSON.stringify(env.K1),
        'process.env.K4': JSON.stringify(env.K4),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
