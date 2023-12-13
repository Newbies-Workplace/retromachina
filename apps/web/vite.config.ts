import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import { svgrComponent } from 'vite-plugin-svgr-component'
import EnvironmentPlugin from "vite-plugin-environment";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    return {
        plugins: [
            svgrComponent(),
            react(),
            EnvironmentPlugin('all', { prefix: 'RETRO_' }),
        ],
        envDir: '../',
        root: 'src',
        build: {
            outDir: '../dist',
            sourcemap: true,
        },
        server: {
            host: '0.0.0.0',
            port: 8080,
        }
    }
})
