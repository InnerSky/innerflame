import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,json}'],
        },
        manifest: {
          name: 'InnerFlame',
          short_name: 'InnerFlame',
          description: 'Strategic business planning assistant',
          theme_color: '#212121',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@innerflame/types': path.resolve(__dirname, '../../packages/types/src'),
        '@innerflame/ui': path.resolve(__dirname, '../../packages/ui/src'),
        '@innerflame/utils': path.resolve(__dirname, '../../packages/utils/src'),
        '@innerflame/ai-tools': path.resolve(__dirname, '../../packages/ai-tools/src'),
        '@innerflame/services': path.resolve(__dirname, '../../packages/services/src'),
      },
    },
    server: {
      watch: {
        usePolling: true,
      },
      host: true, // needed for docker
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      },
    },
  };
}); 