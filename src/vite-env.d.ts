/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EPAT_USERNAME: string;
  readonly VITE_EPAT_PASSWORD: string;
  readonly VITE_EPAT_API_URL?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
