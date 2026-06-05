import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    // Stamp the build time into the bundle so the cache version changes
    // automatically on every deploy — no manual version bumping needed.
    define: {
        __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:3001",
                ws: true,
                changeOrigin: true,
            },
        },
    },
});

