import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Footer from './Footer';
import { trackEvent } from '@app/analytics';

vi.mock('@app/analytics', () => ({ trackEvent: vi.fn() }));

describe('Footer', () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  it('links to sponsors and to the source', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Sponsor' })).toHaveAttribute(
      'href',
      'https://github.com/sponsors/vaskort'
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/vaskort/metronomos'
    );
  });

  // A dropped rel is a real security regression and is invisible by eye.
  it('opens external links without leaking the opener or referrer', () => {
    render(<Footer />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('reports a donate click', () => {
    render(<Footer />);

    fireEvent.click(screen.getByRole('link', { name: 'Sponsor' }));

    expect(trackEvent).toHaveBeenCalledWith('donate_click', {
      destination: 'github_sponsors',
    });
  });

  it('reports a source click', () => {
    render(<Footer />);

    fireEvent.click(screen.getByRole('link', { name: 'GitHub' }));

    expect(trackEvent).toHaveBeenCalledWith('source_click');
  });
});
