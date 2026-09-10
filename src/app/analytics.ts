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

/**
 * A production build with an ID configured. The dev server and the test suite
 * never report, so local use cannot pollute the stats.
 */
const enabled = import.meta.env.PROD && Boolean(GA_ID);

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// `_args` exists only to type the call sites. The body must push the raw
// `arguments` object: gtag.js reads it back off the queue as-is, and a real
// array pushed via rest params is not equivalent.
function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
}

export function initAnalytics(): void {
  // The !GA_ID half is redundant at runtime — `enabled` already covers it — but
  // it narrows the type away from `string | undefined` for the URL below.
  if (!enabled || !GA_ID) return;

  window.dataLayer = window.dataLayer || [];

  // Consent seam: a banner would call gtag('consent', 'default', {...}) here,
  // before the config call below, to hold storage off until the user accepts.

  const script = document.createElement('script');
  script.async = true;
  script.src = `${GTAG_SRC}?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);

  gtag('js', new Date());
  gtag('config', GA_ID);
}

/**
 * Send a custom event. Note GA4's Enhanced Measurement already reports outbound
 * clicks as a generic `click`, so named events like these show up alongside it —
 * they exist because they are far easier to report on.
 */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (!enabled) return;

  gtag('event', name, params);
}
