import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
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
