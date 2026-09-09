/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * GA4 measurement ID (G-XXXXXXXXXX). Supplied by the deploy workflow from a
   * GitHub repository variable; absent locally, which switches analytics off.
   * Not a secret — GA IDs are public and visible in any GA site's page source.
   */
  readonly VITE_GA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
