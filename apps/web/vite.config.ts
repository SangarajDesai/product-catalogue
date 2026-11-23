import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
  const { API_PORT = "3000", WEB_PORT = "5173" } = loadEnv(mode, repoRoot, "");

  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: Number(WEB_PORT),
      strictPort: true,
      proxy: { "/api": `http://127.0.0.1:${API_PORT}` },
    },
    test: { environment: "jsdom" },
  };
});
