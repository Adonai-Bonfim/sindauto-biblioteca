// Explicit Node-only build for the existing SQLite/HTTP backend tests.
// Cloudflare deploys must use vite.config.ts instead.
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"] },
  plugins: [tailwindcss(), tanstackStart({ server: { entry: "server" } }), nitro({ preset: "node-server", traceDeps: ["pg"] }), react()],
});
