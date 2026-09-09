import type { Plugin } from 'vite';

/**
 * The app loads nothing from anywhere but its own origin and Google Analytics,
 * so it can afford a tight policy. 'unsafe-inline' is only there for styles:
 * antd injects its component CSS into <style> tags at runtime. Note it is
 * deliberately absent from script-src — src/app/analytics.ts bootstraps gtag
 * from bundled code precisely so no inline script is needed.
 *
 * Build-only — the dev server needs 'unsafe-eval' and a websocket for HMR.
 */

// Only what gtag.js actually needs. img-src is required because GA falls back
// to a pixel beacon when fetch/sendBeacon is unavailable.
const GA_SCRIPT = 'https://www.googletagmanager.com';
const GA_CONNECT =
  'https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com';
const GA_IMG = 'https://*.google-analytics.com https://www.googletagmanager.com';

const POLICY = [
  "default-src 'self'",
  `script-src 'self' ${GA_SCRIPT}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${GA_IMG}`,
  "media-src 'self' data:",
  `connect-src 'self' ${GA_CONNECT}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  // frame-ancestors is deliberately absent: browsers ignore it in a <meta>
  // tag, so it is set as an HTTP header by the host instead (see public/_headers).
].join('; ');

export default function csp(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: POLICY },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}
