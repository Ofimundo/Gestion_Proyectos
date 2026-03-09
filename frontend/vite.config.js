import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Configuración del servidor de desarrollo
    server: {
        port: 5173,
        open: true, // Abre el navegador automáticamente
        host: true, // Expone el servidor a la red local
        proxy: {
            // Proxy para peticiones a /api
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
                // Opcional: reescribir la ruta
                rewrite: function (path) { return path.replace(/^\/api/, ''); }
            }
        }
    },
    // Configuración de build para producción
    build: {
        outDir: 'dist',
        sourcemap: true,
        // Tamaño máximo de chunks (en kB)
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // División manual de chunks
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    utils: ['axios']
                }
            }
        }
    },
    // Configuración de resolución de módulos
    resolve: {
        alias: {
            // Alias para importaciones más limpias
            '@': '/src',
            '@components': '/src/components',
            '@pages': '/src/pages',
            '@services': '/src/services',
            '@utils': '/src/utils',
            '@hooks': '/src/hooks',
            '@context': '/src/context',
            '@types': '/src/types'
        }
    },
    // Configuración de optimización de dependencias
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'axios']
    },
    // Variables de entorno expuestas al cliente
    define: {
        'process.env': {}
    }
});
