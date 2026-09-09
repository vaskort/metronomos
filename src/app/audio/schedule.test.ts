import {
  beatTimesUntil,
  clampBpm,
  nextBeatAfterTempoChange,
  secondsPerBeat,
} from './schedule';
import { MAX_BPM, MIN_BPM } from '@utils/constants';

describe('clampBpm', () => {
  it('holds the tempo inside the supported range', () => {
    expect(clampBpm(5)).toBe(MIN_BPM);
    expect(clampBpm(9999)).toBe(MAX_BPM);
    expect(clampBpm(120)).toBe(120);
  });
});

describe('secondsPerBeat', () => {
  it('converts tempo to a beat length', () => {
    expect(secondsPerBeat(60)).toBe(1);
    expect(secondsPerBeat(120)).toBe(0.5);
  });
});

describe('beatTimesUntil', () => {
  it('returns evenly spaced beats inside the lookahead window', () => {
    const times = beatTimesUntil(0, 120, 1.01);
    expect(times).toEqual([0, 0.5, 1]);
  });

  it('returns nothing when the next beat is beyond the window', () => {
    expect(beatTimesUntil(5, 60, 1)).toEqual([]);
  });

  it('excludes the window boundary so beats are never scheduled twice', () => {
    expect(beatTimesUntil(0, 60, 1)).toEqual([0]);
  });

  it('fills a wide window with evenly spaced beats and stops at its edge', () => {
    // A hidden tab uses a 1.5s lookahead; at 400 BPM that is ~10 beats.
    const until = 1.5;
    const times = beatTimesUntil(0, 400, until);
    const step = secondsPerBeat(400);

    times.forEach((time, i) => expect(time).toBeCloseTo(i * step, 10));
    // Every beat inside the window, and no gap wider than one beat left at
    // its edge (compared with tolerance: the two ways of reaching the next
    // beat differ in the last bit).
    expect(times[times.length - 1]).toBeLessThan(until);
    expect(until - times[times.length - 1]).toBeLessThanOrEqual(step + 1e-9);
  });

  it('does not accumulate rounding error over a long run', () => {
    const times = beatTimesUntil(0, 133, 600);
    const step = secondsPerBeat(133);
    expect(times[times.length - 1]).toBeCloseTo((times.length - 1) * step, 9);
  });
});

describe('nextBeatAfterTempoChange', () => {
  it('starts from now when nothing has played yet', () => {
    expect(nextBeatAfterTempoChange(null, 120, 10)).toBeCloseTo(10.02, 10);
  });

  it('keeps the pulse in phase with the last beat heard', () => {
    // Last beat at t=10, new tempo 120 BPM -> next beat lands at 10.5.
    expect(nextBeatAfterTempoChange(10, 120, 10.1)).toBeCloseTo(10.5, 10);
  });

  it('skips forward when the new interval has already elapsed', () => {
    // Last beat at t=10 but the clock is already at 12: 120 BPM steps of 0.5
    // from 10 put the next usable beat at 12.5, not somewhere in the past.
    const next = nextBeatAfterTempoChange(10, 120, 12);
    expect(next).toBeGreaterThanOrEqual(12.02);
    expect((next - 10) % 0.5).toBeCloseTo(0, 10);
  });

  it('never returns a time in the past', () => {
    for (const bpm of [20, 60, 137, 400]) {
      const next = nextBeatAfterTempoChange(0, bpm, 100);
      expect(next).toBeGreaterThan(100);
    }
  });
});
