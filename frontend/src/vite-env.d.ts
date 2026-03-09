/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL base de la API del backend
   * @example 'https://gestion-proyectos-backend-9nj0.onrender.com/api'
   */
  readonly VITE_API_URL: string;

  /**
   * Modo de ejecución de la aplicación
   * @example 'development', 'production', 'test'
   */
  readonly MODE: string;

  /**
   * Indica si la aplicación está en modo desarrollo
   */
  readonly DEV: boolean;

  /**
   * Indica si la aplicación está en modo producción
   */
  readonly PROD: boolean;

  /**
   * Indica si la aplicación se está ejecutando en el servidor (SSR)
   */
  readonly SSR: boolean;

  /**
   * URL base del sitio (útil para rutas absolutas)
   * @example 'http://localhost:5173'
   */
  readonly BASE_URL: string;

  // ============================================
  // Variables de entorno personalizadas
  // ============================================

  /**
   * Título de la aplicación
   * @default 'RPA Manager'
   */
  readonly VITE_APP_TITLE?: string;

  /**
   * Versión de la aplicación
   * @example '1.0.0'
   */
  readonly VITE_APP_VERSION?: string;

  /**
   * Clave de API para servicios externos
   * @example 'pk_test_123456789'
   */
  readonly VITE_API_KEY?: string;

  /**
   * URL para websockets o tiempo real
   * @example 'ws://localhost:3001'
   */
  readonly VITE_WS_URL?: string;

  /**
   * ID de analytics (Google Analytics, etc.)
   * @example 'UA-123456789-1'
   */
  readonly VITE_ANALYTICS_ID?: string;

  /**
   * Entorno de despliegue
   * @example 'local', 'staging', 'production'
   */
  readonly VITE_DEPLOY_ENV?: string;

  /**
   * URL de CDN para assets
   * @example 'https://cdn.misitio.com'
   */
  readonly VITE_CDN_URL?: string;

  /**
   * Habilita/deshabilita el modo debug
   * @example 'true', 'false'
   */
  readonly VITE_DEBUG_MODE?: string;

  /**
   * Email de contacto para reportes de error
   * @example 'soporte@misitio.com'
   */
  readonly VITE_SUPPORT_EMAIL?: string;
}

interface ImportMeta {
  /**
   * Variables de entorno disponibles en la aplicación
   */
  readonly env: ImportMetaEnv;

  /**
   * Resuelve una URL relativa a la URL base actual
   * @param url - URL relativa a resolver
   * @returns URL absoluta
   */
  resolve: (url: string) => string;

  /**
   * Hot Module Replacement (HMR) para desarrollo
   */
  readonly hot?: {
    /**
     * Acepta actualizaciones del módulo
     */
    accept(): void;
    /**
     * Acepta actualizaciones con callback
     */
    accept(cb: (mod: any) => void): void;
    /**
     * Acepta actualizaciones de dependencias
     */
    accept(dep: string, cb: (mod: any) => void): void;
    /**
     * Se ejecuta antes de que el módulo sea reemplazado
     */
    dispose(cb: (data: any) => void): void;
    /**
     * Invalida el módulo actual
     */
    invalidate(): void;
    /**
     * Datos compartidos entre instancias HMR
     */
    data: any;
    /**
     * Declina las actualizaciones HMR
     */
    decline(): void;
  };
}

/**
 * Declaración para archivos .env
 * Permite importar archivos .env como strings
 */
declare module '*.env' {
  const content: string;
  export default content;
}

/**
 * Declaración para archivos de texto
 * Útil para importar archivos .txt, .csv, etc.
 */
declare module '*.txt' {
  const content: string;
  export default content;
}

declare module '*.csv' {
  const content: string;
  export default content;
}

/**
 * Declaración para archivos JSON
 * (generalmente ya incluida en TypeScript)
 */
declare module '*.json' {
  const content: any;
  export default content;
}

/**
 * Declaración para archivos de assets
 * (imágenes, fuentes, etc.)
 */
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.ico' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.woff' {
  const src: string;
  export default src;
}

declare module '*.woff2' {
  const src: string;
  export default src;
}

declare module '*.ttf' {
  const src: string;
  export default src;
}

declare module '*.eot' {
  const src: string;
  export default src;
}

/**
 * Declaración para archivos CSS/SCSS
 */
declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.less' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/**
 * Declaración para variables de entorno en tiempo de compilación
 * (definidas en vite.config.ts)
 */
declare const __APP_VERSION__: string;
declare const __APP_NAME__: string;
declare const __BUILD_TIME__: string;