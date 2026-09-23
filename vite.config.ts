import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          ws: true,
        },
        // Proxy WebSocket for Python proctoring service (gaze detection)
        '/ws/proctor': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: [
        { find: '@core', replacement: path.resolve(__dirname, 'src/core') },
        { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
        { find: '@ui', replacement: path.resolve(__dirname, 'src/ui') },
        { find: '@data', replacement: path.resolve(__dirname, 'src/data') },
        { find: '@theme', replacement: path.resolve(__dirname, 'src/theme') },
        // Fallbacks for transition period and root compatibility
        { find: /^@\/components\/(.*)/, replacement: path.resolve(__dirname, 'components/$1') },
        { find: /^@\/pages\/(.*)/, replacement: path.resolve(__dirname, 'pages/$1') },
        { find: /^@\/utils\/(.*)/, replacement: path.resolve(__dirname, 'utils/$1') },
        { find: /^@\/hooks\/(.*)/, replacement: path.resolve(__dirname, 'hooks/$1') },
        { find: /^@\/types/, replacement: path.resolve(__dirname, 'types.ts') },
        { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
        { find: '@', replacement: path.resolve(__dirname, 'src') },
      ]
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-monaco': ['@monaco-editor/react'],
            'vendor-charts': ['recharts'],
            'vendor-icons': ['lucide-react'],
            'vendor-socket': ['socket.io-client'],
          }
        }
      },
      chunkSizeWarningLimit: 800
    }
  };
});
