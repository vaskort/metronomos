import { MAX_BPM, MIN_BPM } from '@utils/constants';

/**
 * Pure scheduling maths, split out from the engine so it can be tested without
 * a Web Audio implementation.
 */

export const clampBpm = (bpm: number) =>
  Math.min(Math.max(bpm, MIN_BPM), MAX_BPM);

export const secondsPerBeat = (bpm: number) => 60 / clampBpm(bpm);

/**
 * Every beat time in [from, until), stepping by the beat length.
 *
 * `from` is the next unscheduled beat and `until` is `currentTime + lookahead`,
 * so this returns exactly the beats that need handing to the audio clock on
 * this tick — usually one, sometimes zero, occasionally several after the tab
 * has been throttled.
 */
export function beatTimesUntil(
  from: number,
  bpm: number,
  until: number
): number[] {
  const step = secondsPerBeat(bpm);
  const times: number[] = [];

  // Multiply rather than accumulate, so rounding error cannot build up across
  // the beats in a single batch.
  for (let i = 0; from + i * step < until; i += 1) {
    times.push(from + i * step);
  }

  return times;
}

/**
 * Where the next beat falls after a tempo change, keeping the pulse in phase
 * with the beat the listener last heard instead of restarting the bar.
 * Falls back to a small offset from `now` when the new interval has already
 * elapsed (a big jump upward in tempo).
 */
export function nextBeatAfterTempoChange(
  lastBeatTime: number | null,
  bpm: number,
  now: number,
  minOffset = 0.02
): number {
  const step = secondsPerBeat(bpm);

  if (lastBeatTime === null) return now + minOffset;

  let next = lastBeatTime + step;
  while (next < now + minOffset) next += step;

  return next;
}
