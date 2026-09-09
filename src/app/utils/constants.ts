export const MIN_BPM = 20;
export const INITIAL_BPM = 60;
export const MAX_BPM = 400;
export const COLOURS = {
  PRIMARY: '#1890ff', // primary color in Ant Design
  SECONDARY: '#faad14', // yellow color in Ant Design
};

export const INITIAL_VOLUME = 1;
/**
 * The desktop build allowed 500%, which clips badly once it goes through a
 * browser's audio path. 200% is as far as we can push the samples before the
 * click stops sounding like a click.
 */
export const MAX_VOLUME = 2;

/** How often the worker wakes the scheduler, in ms. */
export const SCHEDULER_TICK_MS = 25;

/**
 * How far ahead of the audio clock we schedule clicks, in seconds.
 *
 * Visible: just enough to absorb main-thread jank.
 * Hidden: browsers clamp background timers to ~1Hz (and Chrome to 1/min after
 * five minutes), so we queue enough audio to ride through the gap. The cost is
 * that a tempo change made in a hidden tab takes this long to apply, which
 * nobody will ever notice.
 */
export const LOOKAHEAD_VISIBLE = 0.1;
export const LOOKAHEAD_HIDDEN = 1.5;

/**
 * requestAnimationFrame is paused while hidden, so on return the beat queue
 * holds beats that already sounded. Anything older than this is dropped rather
 * than flashed all at once.
 */
export const BEAT_VISUAL_TOLERANCE = 0.15;
