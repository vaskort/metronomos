import { trackEvent } from '@app/analytics';

const SPONSOR_URL = 'https://github.com/sponsors/vaskort';
const REPO_URL = 'https://github.com/vaskort/metronomos';

/**
 * Plain anchors rather than antd's Typography.Link: that renders in the brand
 * blue, which is the opposite of recessive and would only have to be overridden.
 *
 * target="_blank" is not just convention here — it keeps the app alive when a
 * link is followed, which gives the analytics beacon time to send.
 */
export default function Footer() {
  return (
    <footer className="app-footer">
      <a
        href={SPONSOR_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackEvent('donate_click', { destination: 'github_sponsors' })
        }
      >
        Sponsor
      </a>
      <span aria-hidden="true">·</span>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('source_click')}
      >
        GitHub
      </a>
    </footer>
  );
}
