/**
 * A bare timer that lives off the main thread.
 *
 * The metronome cannot drive itself from setInterval on the main thread: a
 * hidden tab has its timers clamped to ~1Hz, so anything above 60 BPM would
 * silently slow down the moment the user switches tab. A worker is throttled
 * far less aggressively, and combined with the engine's lookahead window it
 * keeps the audio clock fed either way.
 *
 * Deliberately has no imports so Vite can emit it as a classic worker, which
 * works on Safari versions that lack module-worker support.
 */

export type SchedulerMessage =
  | { type: 'start'; interval: number }
  | { type: 'stop' };

let timer: ReturnType<typeof setInterval> | null = null;

function clear() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

self.onmessage = (event: MessageEvent<SchedulerMessage>) => {
  const message = event.data;

  clear();

  if (message?.type === 'start') {
    timer = setInterval(() => self.postMessage('tick'), message.interval);
  }
};
