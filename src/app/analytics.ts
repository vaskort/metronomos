/**
 * Google Analytics 4.
 *
 * Deliberately not Google's copy-paste snippet: that one is an inline <script>,
 * which would force 'unsafe-inline' into script-src and let *any* injected
 * inline script run. Bootstrapping gtag from this module instead keeps the
 * setup as ordinary first-party JavaScript, so the CSP only has to allow the
 * remote gtag.js URL (see vite.csp.ts).
 */

const GA_ID = import.meta.env.VITE_GA_ID;
const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * No-ops unless this is a production build with an ID configured, so the dev
 * server and the test suite never send anything.
 */
export function initAnalytics(): void {
  if (!import.meta.env.PROD || !GA_ID) return;

  window.dataLayer = window.dataLayer || [];

  // `_args` exists only to type the call sites below. The body must push the
  // raw `arguments` object: gtag.js reads it back off the queue as-is, and a
  // real array pushed via rest params is not equivalent.
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  }

  // Consent seam: a banner would call gtag('consent', 'default', {...}) here,
  // before the config call below, to hold storage off until the user accepts.

  const script = document.createElement('script');
  script.async = true;
  script.src = `${GTAG_SRC}?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);

  gtag('js', new Date());
  gtag('config', GA_ID);
}
