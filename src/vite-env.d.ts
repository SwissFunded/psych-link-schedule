/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VITABYTE_API_URL: string;
  readonly VITE_VITABYTE_API_KEY: string;
  readonly VITE_VITABYTE_API_SECRET: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
