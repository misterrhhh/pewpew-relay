import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, "dashboard/index.html"),
        placeholder: resolve(__dirname, "scenes/placeholder/index.html"),
        headToHead: resolve(__dirname, "scenes/head-to-head/index.html"),
        pipCountdown: resolve(__dirname, "scenes/pip-countdown/index.html"),
        veto: resolve(__dirname, "scenes/veto/index.html"),
        matches: resolve(__dirname, "scenes/matches/index.html"),
        matchesCountdown: resolve(__dirname, "scenes/matches-countdown/index.html"),
        upperBracket: resolve(__dirname, "scenes/upper-bracket/index.html"),
        lowerBracket: resolve(__dirname, "scenes/lower-bracket/index.html"),
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3000",
      "/images": "http://127.0.0.1:3000",
      "/ws": {
        target: "ws://127.0.0.1:3000",
        ws: true,
      },
    },
  },
});
