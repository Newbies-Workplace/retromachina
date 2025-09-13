import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";
import tailwindcss from "@tailwindcss/vite";
import EnvironmentPlugin from "vite-plugin-environment";
import {svgrComponent} from "vite-plugin-svgr-component";

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  return {
    plugins: [
      tailwindcss(),
      svgrComponent(),
      react(),
      EnvironmentPlugin("all", {prefix: "RETRO_WEB"}),
    ],
    envDir: "../",
    root: "src",
    build: {
      outDir: "../dist",
      sourcemap: true,
    },
    server: {
      host: "0.0.0.0",
      port: 8080,
    },
  };
});
