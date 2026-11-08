import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // `import Icon from "./icon.svg"` yields a React component (see
      // src/types/svg.d.ts); `?inline` imports stay data URLs.
      svgr({ include: "**/*.svg", svgrOptions: { exportType: "default" } }),
      EnvironmentPlugin("all", { prefix: "RETRO_WEB" }),
    ],
    resolve: {
      // Hoisted dependencies (e.g. react-router) must use the app's React,
      // not another copy that other workspace tools pull into the root.
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },
    optimizeDeps: {
      include: ["shared/**"],
      force: true,
    },
    envDir: "../",
    root: "src",
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      // Generated for debugging, but not referenced from the served bundles.
      sourcemap: "hidden" as const,
      commonjsOptions: {
        include: [/node_modules/, /packages\/shared/],
      },
    },
    server: {
      host: "0.0.0.0",
      port: 8080,
    },
  };
});
