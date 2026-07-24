import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sockjs-client (used by the live-chat WebSocket client) expects Node's
  // `global` to exist; the browser doesn't have one.
  define: {
    global: "globalThis",
  },
  // 🔥 මෙන්න මේ server කෑල්ල විතරක් අලුතින් එකතු කරන්න:
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080", // Java Backend එක run වෙන port එක
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
