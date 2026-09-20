import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";
import { svgrComponent } from "vite-plugin-svgr-component";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      svgrComponent(),
      EnvironmentPlugin("all", { prefix: "RETRO_WEB" }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    optimizeDeps: {
      include: ["shared/**"],
    },
    envDir: "../",
    root: "src",
    build: {
      outDir: "../dist",
      sourcemap: true,
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
