import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 4174;
const strictPort = Boolean(rawPort);

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const rawBasePath = process.env.BASE_PATH || "/";
const basePath = rawBasePath === "" ? "/" : rawBasePath;
const isReplit = process.env.REPL_ID !== undefined;
const enableReplitPlugins = process.env.NODE_ENV !== "production" && isReplit;

async function resolvePlugins() {
  const plugins = [react(), tailwindcss()];

  if (enableReplitPlugins) {
    const { default: runtimeErrorOverlay } = await import(
      "@replit/vite-plugin-runtime-error-modal"
    );
    plugins.push(runtimeErrorOverlay());

    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(
      cartographer({
        root: path.resolve(import.meta.dirname, ".."),
      }),
    );

    const { devBanner } = await import("@replit/vite-plugin-dev-banner");
    plugins.push(devBanner());
  }

  return plugins;
}

export default defineConfig({
  base: basePath,
  plugins: await resolvePlugins(),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
