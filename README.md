# Metronomos

A precise and reliable metronome for musicians — a static, installable PWA
that works offline. Live at [metronomos.io](https://metronomos.io).

Previously released as **TempoSonus**, a macOS app on the Mac App Store built
with Electron. This repo is the web version, and keeps the same audio engine —
which explains why the timing code is more elaborate than a metronome might
otherwise warrant.

## Getting started

```bash
npm install
```

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Dev server at http://localhost:5173              |
| `npm run build`   | Typecheck, then build the app to `dist-web/`     |
| `npm run preview` | Serve the production build locally               |
| `npm test`        | Vitest                                           |
| `npm run lint`    | ESLint                                           |

## How it works

```
src/
└─ app/
   ├─ audio/       the metronome engine
   ├─ components/
   ├─ hooks/
   └─ utils/
```

### The audio engine

The timing is the whole product, so it does not run on `setInterval`. A
`setInterval` in a hidden browser tab is clamped to roughly 1 Hz, which would
silently drag anything above 60 BPM down to 60, and it jitters by tens of
milliseconds under main-thread load.

Instead, `src/app/audio/engine.ts` uses the standard Web Audio lookahead
pattern:

1. A timer in a **Web Worker** (`scheduler.worker.ts`) wakes every 25 ms —
   off the main thread, so it is throttled far less aggressively.
2. On each wake it schedules every beat falling in the next lookahead window
   onto the **AudioContext hardware clock** via `AudioBufferSourceNode.start(when)`.
3. The lookahead widens from 100 ms to 1.5 s when the page is hidden, so the
   audio stays fed even if the timer is throttled hard.

Because the beats are handed to the audio clock ahead of time, the actual
sound is sample-accurate no matter when the timer fires. Nothing about the
timing depends on React.

The visual flash is driven from a `requestAnimationFrame` loop that fires each
beat when `currentTime` reaches it — not when it was scheduled, which would be
up to a full lookahead window early.

`src/app/audio/schedule.ts` holds the pure timing maths and is unit tested.

### Security headers

`vite.csp.ts` injects the Content-Security-Policy into `index.html` at build
time. `frame-ancestors` is the one exception — browsers ignore it in a `<meta>`
tag, so it lives in `public/_headers` instead, and applies only on hosts that
serve custom headers.

## Licence

MIT — see [LICENSE](LICENSE).
