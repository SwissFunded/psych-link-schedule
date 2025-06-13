// vite.config.ts
import { defineConfig } from "file:///Users/miro/Desktop/psych-link-schedule/node_modules/vite/dist/node/index.js";
import react from "file:///Users/miro/Desktop/psych-link-schedule/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///Users/miro/Desktop/psych-link-schedule/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/Users/miro/Desktop/psych-link-schedule";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "2f25dceb-e74d-4563-8237-8d09a9b56aca.lovableproject.com",
      "lovable.dev",
      "*.lovable.dev",
      "*.lovableproject.com"
    ],
    proxy: {
      "/api/system": {
        target: "https://psych.vitabyte.ch/v1/system",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api\/system/, ""),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader("Authorization", req.headers.authorization);
            }
            if (req.headers["content-type"]) {
              proxyReq.setHeader("Content-Type", req.headers["content-type"]);
            }
            console.log("\u{1F527} Proxy forwarding headers:", {
              authorization: req.headers.authorization ? "[REDACTED]" : "Missing",
              contentType: req.headers["content-type"]
            });
          });
        }
      },
      "/api/agenda": {
        target: "https://psych.vitabyte.ch/v1/agenda",
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api\/agenda/, ""),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader("Authorization", req.headers.authorization);
            }
            if (req.headers["content-type"]) {
              proxyReq.setHeader("Content-Type", req.headers["content-type"]);
            }
            console.log("\u{1F527} Proxy forwarding headers:", {
              authorization: req.headers.authorization ? "[REDACTED]" : "Missing",
              contentType: req.headers["content-type"]
            });
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "framer-motion",
            "lucide-react"
          ]
        }
      }
    }
  },
  define: {
    "import.meta.env.APP_VERSION": JSON.stringify(process.env.npm_package_version || "0.2.0"),
    "import.meta.env.BUILD_TIME": JSON.stringify((/* @__PURE__ */ new Date()).toISOString())
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbWlyby9EZXNrdG9wL3BzeWNoLWxpbmstc2NoZWR1bGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9taXJvL0Rlc2t0b3AvcHN5Y2gtbGluay1zY2hlZHVsZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbWlyby9EZXNrdG9wL3BzeWNoLWxpbmstc2NoZWR1bGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIGFsbG93ZWRIb3N0czogW1xuICAgICAgXCIyZjI1ZGNlYi1lNzRkLTQ1NjMtODIzNy04ZDA5YTliNTZhY2EubG92YWJsZXByb2plY3QuY29tXCIsXG4gICAgICBcImxvdmFibGUuZGV2XCIsXG4gICAgICBcIioubG92YWJsZS5kZXZcIixcbiAgICAgIFwiKi5sb3ZhYmxlcHJvamVjdC5jb21cIixcbiAgICBdLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaS9zeXN0ZW0nOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vcHN5Y2gudml0YWJ5dGUuY2gvdjEvc3lzdGVtJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvc3lzdGVtLywgJycpLFxuICAgICAgICBzZWN1cmU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCBfcmVzKSA9PiB7XG4gICAgICAgICAgICAvLyBGb3J3YXJkIGFsbCBoZWFkZXJzIGZyb20gdGhlIG9yaWdpbmFsIHJlcXVlc3RcbiAgICAgICAgICAgIGlmIChyZXEuaGVhZGVycy5hdXRob3JpemF0aW9uKSB7XG4gICAgICAgICAgICAgIHByb3h5UmVxLnNldEhlYWRlcignQXV0aG9yaXphdGlvbicsIHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXSkge1xuICAgICAgICAgICAgICBwcm94eVJlcS5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVERDI3IFByb3h5IGZvcndhcmRpbmcgaGVhZGVyczonLCB7XG4gICAgICAgICAgICAgIGF1dGhvcml6YXRpb246IHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb24gPyAnW1JFREFDVEVEXScgOiAnTWlzc2luZycsXG4gICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiByZXEuaGVhZGVyc1snY29udGVudC10eXBlJ11cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgICcvYXBpL2FnZW5kYSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9wc3ljaC52aXRhYnl0ZS5jaC92MS9hZ2VuZGEnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC9hZ2VuZGEvLCAnJyksXG4gICAgICAgIHNlY3VyZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJlOiAocHJveHksIF9vcHRpb25zKSA9PiB7XG4gICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVxJywgKHByb3h5UmVxLCByZXEsIF9yZXMpID0+IHtcbiAgICAgICAgICAgIC8vIEZvcndhcmQgYWxsIGhlYWRlcnMgZnJvbSB0aGUgb3JpZ2luYWwgcmVxdWVzdFxuICAgICAgICAgICAgaWYgKHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb24pIHtcbiAgICAgICAgICAgICAgcHJveHlSZXEuc2V0SGVhZGVyKCdBdXRob3JpemF0aW9uJywgcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddKSB7XG4gICAgICAgICAgICAgIHByb3h5UmVxLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdUREMjcgUHJveHkgZm9yd2FyZGluZyBoZWFkZXJzOicsIHtcbiAgICAgICAgICAgICAgYXV0aG9yaXphdGlvbjogcmVxLmhlYWRlcnMuYXV0aG9yaXphdGlvbiA/ICdbUkVEQUNURURdJyA6ICdNaXNzaW5nJyxcbiAgICAgICAgICAgICAgY29udGVudFR5cGU6IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiYgY29tcG9uZW50VGFnZ2VyKCksXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFtcbiAgICAgICAgICAgICdyZWFjdCcsXG4gICAgICAgICAgICAncmVhY3QtZG9tJyxcbiAgICAgICAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICAgICAgICdmcmFtZXItbW90aW9uJyxcbiAgICAgICAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGRlZmluZToge1xuICAgICdpbXBvcnQubWV0YS5lbnYuQVBQX1ZFUlNJT04nOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5ucG1fcGFja2FnZV92ZXJzaW9uIHx8ICcwLjIuMCcpLFxuICAgICdpbXBvcnQubWV0YS5lbnYuQlVJTERfVElNRSc6IEpTT04uc3RyaW5naWZ5KG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSksXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVTLFNBQVMsb0JBQW9CO0FBQ3BVLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixj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
