/// <reference types="vite/client" />

/**
 * Vite client env typing for MOC web.
 * VITE_API_BASE_URL is the backend origin only (no path); /api is appended in client.ts.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
