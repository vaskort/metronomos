import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const gtagScripts = () =>
  document.head.querySelectorAll('script[src*="googletagmanager"]');

/** Re-import with a fresh module registry so the module-level GA_ID re-reads env. */
const loadAnalytics = async () => {
  vi.resetModules();
  return (await import('./analytics')).initAnalytics;
};

const loadTrackEvent = async () => {
  vi.resetModules();
  return (await import('./analytics')).trackEvent;
};

describe('initAnalytics', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    delete window.dataLayer;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends nothing when no measurement ID is configured', async () => {
    vi.stubEnv('VITE_GA_ID', '');

    (await loadAnalytics())();

    expect(gtagScripts()).toHaveLength(0);
    expect(window.dataLayer).toBeUndefined();
  });

  // The guard that actually protects the stats: a dev or test run must never
  // report, even if an ID happens to be present in the environment.
  it('sends nothing outside a production build even with an ID set', async () => {
    vi.stubEnv('VITE_GA_ID', 'G-TEST123456');

    (await loadAnalytics())();

    expect(gtagScripts()).toHaveLength(0);
    expect(window.dataLayer).toBeUndefined();
  });
});

describe('trackEvent', () => {
  beforeEach(() => {
    delete window.dataLayer;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('queues nothing while analytics is disabled', async () => {
    vi.stubEnv('VITE_GA_ID', 'G-TEST123456');

    (await loadTrackEvent())('donate_click', { destination: 'x' });

    expect(window.dataLayer).toBeUndefined();
  });
});
