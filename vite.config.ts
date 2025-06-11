import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "2f25dceb-e74d-4563-8237-8d09a9b56aca.lovableproject.com",
      "lovable.dev",
      "*.lovable.dev",
      "*.lovableproject.com",
    ],
    proxy: {
      '/api/system': {
        target: 'https://psych.vitabyte.ch/v1/system',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/system/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward all headers from the original request
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            console.log('🔧 Proxy forwarding headers:', {
              authorization: req.headers.authorization ? '[REDACTED]' : 'Missing',
              contentType: req.headers['content-type']
            });
          });
        },
      },
      '/api/agenda': {
        target: 'https://psych.vitabyte.ch/v1/agenda',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/agenda/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward all headers from the original request
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            console.log('🔧 Proxy forwarding headers:', {
              authorization: req.headers.authorization ? '[REDACTED]' : 'Missing',
              contentType: req.headers['content-type']
            });
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'framer-motion',
            'lucide-react',
          ],
        },
      },
    },
  },
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(process.env.npm_package_version || '0.2.0'),
    'import.meta.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
}));
