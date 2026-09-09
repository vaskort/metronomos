import type { Plugin } from 'vite';

/**
 * The app loads nothing from anywhere but its own origin, so it can afford a
 * tight policy. 'unsafe-inline' is only there for styles: antd injects its
 * component CSS into <style> tags at runtime.
 *
 * Build-only — the dev server needs 'unsafe-eval' and a websocket for HMR.
 * Applied to the web target alone: under file://, which the desktop build
 * uses, the origin is opaque and 'self' matches nothing.
 */
const POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self' data:",
  "connect-src 'self'",
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
