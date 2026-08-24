/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Deploy target: development | testing | staging | production. Prod hides the UI banner. */
  readonly VITE_APP_ENV?: string;
  readonly VITE_ENCRYPTION_KEY?: string;
  readonly VITE_ENCRYPTION_AAD?: string;
  readonly VITE_ENCRYPTION_ITERATIONS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
