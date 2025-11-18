import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: true,
        https: {
          key: fs.readFileSync(path.resolve(__dirname, 'cert/localhost+2-key.pem')),
          cert: fs.readFileSync(path.resolve(__dirname, 'cert/localhost+2.pem')),
        },
        allowedHosts: true,
      },
      plugins: [
        react(),
        basicSsl()
      ],
      define: {
        'process.env.DEFAULT_SERVER_API_URL': JSON.stringify(env.DEFAULT_SERVER_API_URL),
        'process.env.SERVER_API_URLS': JSON.stringify(env.SERVER_API_URLS),
        'process.env.VITE_K1': JSON.stringify(env.VITE_K1),
        'process.env.VITE_K4': JSON.stringify(env.VITE_K4),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
