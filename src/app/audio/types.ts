export type SoundName = 'low' | 'high';

/** Emitted once per beat, at the moment the click is actually audible. */
export interface BeatEvent {
  /** Monotonically increasing beat counter since the last start(). */
  index: number;
  /** AudioContext timestamp the click was scheduled for, in seconds. */
  time: number;
}
