/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STOCKS_WS_URL?: string;
  readonly VITE_FOREX_WS_URL?: string;
  readonly VITE_CRYPTO_WS_URL?: string;
  readonly VITE_EOD_WS_KEY?: string;
  readonly VITE_EOD_REST_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
