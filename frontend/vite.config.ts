import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: './', // Use relative paths for assets
    build: {
        outDir: './dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    mui: ['@mui/material', '@mui/icons-material'],
                    utils: ['react-router-dom', 'axios']
                }
            }
        }
    },
    server: {
        host: true, // Accept connections from any IP
        https: false, // Explicitly disable HTTPS
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    preview: {
        host: true,
        https: false, // Explicitly disable HTTPS for preview
        port: 4173
    }
})