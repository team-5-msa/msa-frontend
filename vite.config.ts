import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://apigateway-iota.vercel.app",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/review": {
        target: "https://review-service-zeta.vercel.app",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/review/, ""),
      },
    },
  },
});
