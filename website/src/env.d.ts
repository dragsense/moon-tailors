/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ENV?: string;
  readonly PUBLIC_APP_ENV?: string;
  readonly PUBLIC_SITE_NAME?: string;
  readonly PUBLIC_SITE_TAGLINE?: string;
  readonly PUBLIC_SITE_DESCRIPTION?: string;
  readonly PUBLIC_SITE_COVER?: string;
  readonly PUBLIC_APP_URL?: string;
  readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
