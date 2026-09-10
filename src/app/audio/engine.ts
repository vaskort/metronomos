import Emitter from '@utils/emitter';
import highPitchSound from '@assets/sounds/MetronomeQuartz_hi.wav';
import lowPitchSound from '@assets/sounds/MetronomeQuartz_lo.wav';
import {
  BEAT_VISUAL_TOLERANCE,
  INITIAL_BPM,
  INITIAL_VOLUME,
  LOOKAHEAD_HIDDEN,
  LOOKAHEAD_VISIBLE,
  MAX_VOLUME,
  SCHEDULER_TICK_MS,
} from '@utils/constants';
import type { BeatEvent, SoundName } from './types';
import { beatTimesUntil, clampBpm, nextBeatAfterTempoChange } from './schedule';

const SOUND_URLS: Record<SoundName, string> = {
  low: lowPitchSound,
  high: highPitchSound,
};

interface ScheduledBeat {
  source: AudioBufferSourceNode;
  time: number;
  index: number;
}

/**
 * WebKit's AudioSession API, not yet in lib.dom. Safari 16.4+ only, hence
 * optional — everywhere else the property is simply absent.
 */
type NavigatorWithAudioSession = Navigator & {
  audioSession?: { type: 'auto' | 'playback' | 'ambient' | 'play-and-record' };
};

/**
 * iOS routes Web Audio through the "ambient" audio session by default, which
 * the physical ringer switch silences — so the metronome looks like it is
 * running but makes no sound. (HTML5 <audio> is exempt; Web Audio is not.)
 * Declaring "playback" says this is deliberate media that should ignore the
 * mute switch.
 *
 * Must be set once before the context exists; flipping it mid-session
 * confuses iOS. A no-op on every other platform.
 */
function claimPlaybackAudioSession(): void {
  const nav = navigator as NavigatorWithAudioSession;
  if (nav.audioSession) nav.audioSession.type = 'playback';
}

/**
 * Web Audio metronome using the standard lookahead pattern: a coarse timer
 * (in a worker) periodically hands the next slice of beats to the audio
 * clock, which plays them with sample accuracy. Nothing about the timing
 * depends on when the timer actually fires, only that it fires often enough
 * to stay ahead — which is what makes this survive main-thread jank and
 * background-tab throttling.
 */
export default class MetronomeEngine {
  /** Fires once per beat, at the moment the click becomes audible. */
  readonly beats = new Emitter<BeatEvent>();

  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private buffers = new Map<SoundName, AudioBuffer>();
  private worker: Worker | null = null;
  private loading: Promise<void> | null = null;

  private running = false;
  private bpm = INITIAL_BPM;
  private volume = INITIAL_VOLUME;
  private sound: SoundName = 'low';

  private nextNoteTime = 0;
  private beatIndex = 0;
  private lastBeatTime: number | null = null;
  private queue: ScheduledBeat[] = [];
  private rafId: number | null = null;

  get isRunning() {
    return this.running;
  }

  /**
   * Creates the AudioContext and decodes the samples. Safe to call more than
   * once. Must be called from a user gesture the first time, or the context
   * will be created in a suspended state and stay there.
   */
  async prepare(): Promise<void> {
    if (!this.ctx) {
      claimPlaybackAudioSession();

      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!Ctor) throw new Error('Web Audio is not supported in this browser.');

      this.ctx = new Ctor();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(this.ctx.destination);

      document.addEventListener('visibilitychange', this.handleVisibility);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this.loading) this.loading = this.loadBuffers();
    await this.loading;
  }

  private async loadBuffers(): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;

    await Promise.all(
      (Object.keys(SOUND_URLS) as SoundName[]).map(async (name) => {
        const response = await fetch(SOUND_URLS[name]);
        const bytes = await response.arrayBuffer();
        this.buffers.set(name, await ctx.decodeAudioData(bytes));
      })
    );
  }

  async start(): Promise<void> {
    if (this.running) return;

    await this.prepare();
    const ctx = this.ctx;
    if (!ctx) return;

    this.running = true;
    this.beatIndex = 0;
    this.lastBeatTime = null;
    // Small offset so the first click isn't scheduled in the past.
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.ensureWorker().postMessage({
      type: 'start',
      interval: SCHEDULER_TICK_MS,
    });

    this.scheduleAhead();
    this.startVisualLoop();
  }

  stop(): void {
    if (!this.running) return;

    this.running = false;
    this.worker?.postMessage({ type: 'stop' });
    this.cancelFrom(0);

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  async toggle(): Promise<void> {
    if (this.running) this.stop();
    else await this.start();
  }

  setBpm(bpm: number): void {
    this.bpm = clampBpm(bpm);

    const ctx = this.ctx;
    if (!this.running || !ctx) return;

    // Drop everything not yet heard and re-lay the grid from the last beat the
    // listener actually got, so the pulse stays in phase across the change.
    const now = ctx.currentTime;
    const dropped = this.cancelFrom(now);

    if (dropped) this.beatIndex = dropped.index;
    this.nextNoteTime = nextBeatAfterTempoChange(
      this.lastBeatTime,
      this.bpm,
      now
    );
    this.scheduleAhead();
  }

  setVolume(volume: number): void {
    this.volume = Math.min(Math.max(volume, 0), MAX_VOLUME);

    if (this.gain && this.ctx) {
      // Ramp rather than jump, otherwise dragging the slider produces clicks.
      this.gain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.01);
    }
  }

  setSound(sound: SoundName): void {
    this.sound = sound;

    const ctx = this.ctx;
    if (!this.running || !ctx) return;

    // Re-schedule pending beats so the new sample takes effect immediately,
    // keeping both the grid and the beat numbering exactly where they were.
    const dropped = this.cancelFrom(ctx.currentTime);

    if (dropped) {
      this.nextNoteTime = dropped.time;
      this.beatIndex = dropped.index;
      this.scheduleAhead();
    }
  }

  dispose(): void {
    this.stop();
    this.beats.clear();
    this.worker?.terminate();
    this.worker = null;
    document.removeEventListener('visibilitychange', this.handleVisibility);
    void this.ctx?.close();
    this.ctx = null;
    this.gain = null;
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('./scheduler.worker.ts', import.meta.url)
      );
      this.worker.onmessage = () => this.scheduleAhead();
    }

    return this.worker;
  }

  /** Hand the audio clock every beat that falls inside the lookahead window. */
  private scheduleAhead = (): void => {
    const ctx = this.ctx;
    const gain = this.gain;
    if (!this.running || !ctx || !gain) return;

    const buffer = this.buffers.get(this.sound);
    if (!buffer) return;

    const now = ctx.currentTime;

    // The visual loop normally drains the queue, but requestAnimationFrame is
    // paused while the tab is hidden. Pruning here too — this runs off the
    // worker, which keeps ticking — stops the queue growing without bound
    // during a long background session.
    this.prune(now);

    // If the clock ever gets ahead of us — a long stall, a suspended context
    // that resumed oddly — skip the missed beats instead of firing them all at
    // once. Phase is preserved; only the backlog is dropped.
    if (this.nextNoteTime < now) {
      this.nextNoteTime = nextBeatAfterTempoChange(
        this.nextNoteTime,
        this.bpm,
        now
      );
    }

    const lookahead = document.hidden ? LOOKAHEAD_HIDDEN : LOOKAHEAD_VISIBLE;
    const times = beatTimesUntil(this.nextNoteTime, this.bpm, now + lookahead);

    times.forEach((time) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.onended = () => source.disconnect();
      source.start(time);

      this.queue.push({ source, time, index: this.beatIndex });
      this.beatIndex += 1;
    });

    if (times.length) {
      this.nextNoteTime =
        times[times.length - 1] + 60 / clampBpm(this.bpm);
    }
  };

  /**
   * Stop and forget every beat scheduled at or after `time`.
   * Returns the earliest beat that was dropped, so callers can resume the grid
   * and the beat numbering from exactly where it was cut.
   */
  private cancelFrom(time: number): ScheduledBeat | null {
    let first: ScheduledBeat | null = null;

    this.queue = this.queue.filter((beat) => {
      if (beat.time < time) return true;

      if (!first || beat.time < first.time) first = beat;

      try {
        beat.source.stop();
      } catch {
        // Already finished; nothing to cancel.
      }
      beat.source.disconnect();
      return false;
    });

    return first;
  }

  /**
   * Drop beats that have already sounded and are too old to be worth showing.
   * Records them as the last beat heard so a tempo change stays in phase even
   * if the visual loop never ran.
   */
  private prune(now: number): void {
    while (
      this.queue.length &&
      this.queue[0].time < now - BEAT_VISUAL_TOLERANCE
    ) {
      const beat = this.queue.shift() as ScheduledBeat;
      this.lastBeatTime = beat.time;
    }
  }

  private startVisualLoop(): void {
    if (this.rafId !== null) return;

    const frame = () => {
      const ctx = this.ctx;
      if (!this.running || !ctx) return;

      const now = ctx.currentTime;

      while (this.queue.length && this.queue[0].time <= now) {
        const beat = this.queue.shift() as ScheduledBeat;
        this.lastBeatTime = beat.time;

        // rAF is paused while hidden, so on return the queue holds beats that
        // already sounded. Flashing them all would look like a stutter.
        if (now - beat.time <= BEAT_VISUAL_TOLERANCE) {
          this.beats.emit({ index: beat.index, time: beat.time });
        }
      }

      this.rafId = requestAnimationFrame(frame);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  /**
   * Browsers suspend the AudioContext when a tab goes to the background on
   * mobile, and it does not always come back on its own.
   */
  private handleVisibility = (): void => {
    if (document.hidden || !this.running) return;

    if (this.ctx?.state === 'suspended') void this.ctx.resume();
    if (this.rafId === null) this.startVisualLoop();
  };
}
