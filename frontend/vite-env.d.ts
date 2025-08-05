/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // puedes declarar más variables aquí si las usas
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
