import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  const config = {
    plugins: [
      react(),
      tailwindcss(), 
    ],
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            icons: ['lucide-react'],
            charts: ['recharts'],
            maps: ['leaflet']
          }
        }
      }
    },
    // Define environment variables that will be available to the client
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    }
  };

  // Only add server config in development mode
  if (command === 'serve') {
    config.server = {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
          // Add error handling for proxy
          onError: (err, req, res) => {
            console.error('Proxy error:', err);
          },
          // Log proxy requests in development
          onProxyReq: (proxyReq, req, res) => {
            console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.getHeader('host')}${proxyReq.path}`);
          }
        }
      }
    };
  }

  return config;
});