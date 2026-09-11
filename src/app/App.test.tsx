import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the metronome controls', () => {
    render(<App />);
    expect(screen.getByText('BPM')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /start metronome/i })
    ).toBeInTheDocument();
  });

  // The <h1> is invisible, so nothing about the UI would look wrong if it were
  // dropped — but the document would lose its only top-level heading.
  it('renders exactly one h1 naming the app', () => {
    render(<App />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/online metronome/i);
  });
});
