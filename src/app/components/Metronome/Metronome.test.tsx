import { act, fireEvent, render, screen } from '@testing-library/react';
import Metronome from './index';
import { COLOURS, INITIAL_BPM, MIN_BPM } from '@utils/constants';

// jsdom has no Web Audio; the engine is exercised in schedule.test.ts and in
// the browser. These cover the control wiring only.
vi.mock('@hooks/useMetronome', () => ({
  default: () => ({
    isPlaying: false,
    togglePlaying: vi.fn(),
    updateBpm: vi.fn(),
    updateSound: vi.fn(),
    updateVolume: vi.fn(),
    volume: 1,
    beatIndex: -1,
    error: null,
  }),
}));

const bpmField = () =>
  screen.getByLabelText('Beats per minute') as HTMLInputElement;

/**
 * Clicks synchronously inside one act() so React batches them into a single
 * render. Awaiting between clicks (as userEvent does) flushes state each time
 * and hides the stale-closure bug these tests exist to catch.
 */
const clickBatch = (element: HTMLElement, times: number) =>
  act(() => {
    for (let i = 0; i < times; i += 1) fireEvent.click(element);
  });

describe('Metronome tempo controls', () => {
  it('applies every increment when + is clicked rapidly', () => {
    render(<Metronome />);
    clickBatch(screen.getByLabelText('Increase tempo'), 5);

    // Reading inputBpm from the render closure leaves this at INITIAL_BPM + 1.
    expect(bpmField().value).toBe(String(INITIAL_BPM + 5));
  });

  it('applies every decrement when - is clicked rapidly', () => {
    render(<Metronome />);
    clickBatch(screen.getByLabelText('Decrease tempo'), 3);

    expect(bpmField().value).toBe(String(INITIAL_BPM - 3));
  });

  it('clamps to the minimum tempo', () => {
    render(<Metronome />);
    clickBatch(screen.getByLabelText('Decrease tempo'), INITIAL_BPM);

    expect(Number(bpmField().value)).toBe(MIN_BPM);
  });
});

describe('Metronome beat indicator', () => {
  it('rests on the primary colour before the first beat', () => {
    const { container } = render(<Metronome />);

    // beatIndex is -1 at rest; a plain `% 2 === 0` check lands on the
    // secondary colour there, because -1 % 2 is -1 in JavaScript.
    expect(container.querySelector('circle')?.getAttribute('fill')).toBe(
      COLOURS.PRIMARY
    );
  });
});
