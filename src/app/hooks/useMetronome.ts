import { useCallback, useEffect, useRef, useState } from 'react';
import MetronomeEngine from '@audio/engine';
import { INITIAL_VOLUME } from '@utils/constants';
import type { SoundName } from '@audio/types';

/**
 * React wrapper around the audio engine. Deliberately thin: the engine owns
 * all timing state, so React re-renders can never affect the beat.
 */
function useMetronome(initialBpm: number) {
  const engineRef = useRef<MetronomeEngine | null>(null);
  if (engineRef.current === null) engineRef.current = new MetronomeEngine();
  const engine = engineRef.current;

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(INITIAL_VOLUME);
  const [beatIndex, setBeatIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const initialBpmRef = useRef(initialBpm);

  useEffect(() => {
    engine.setBpm(initialBpmRef.current);
    const unsubscribe = engine.beats.on(({ index }) => setBeatIndex(index));

    if (import.meta.env.DEV) {
      (window as unknown as { __metronome?: MetronomeEngine }).__metronome =
        engine;
    }

    return () => {
      unsubscribe();
      engine.dispose();
    };
  }, [engine]);

  const togglePlaying = useCallback(async () => {
    try {
      if (engine.isRunning) {
        engine.stop();
        setIsPlaying(false);
      } else {
        // Must stay inside the gesture that triggered it, or the browser
        // will refuse to start the AudioContext.
        await engine.start();
        setIsPlaying(true);
      }
      setError(null);
    } catch (cause) {
      setIsPlaying(false);
      setError(
        cause instanceof Error ? cause.message : 'Could not start audio.'
      );
    }
  }, [engine]);

  // No debouncing: re-laying the beat grid is a handful of object allocations,
  // so the slider can drive the tempo directly and feel immediate.
  const updateBpm = useCallback((bpm: number) => engine.setBpm(bpm), [engine]);

  const updateVolume = useCallback(
    (value: number) => {
      setVolume(value);
      engine.setVolume(value);
    },
    [engine]
  );

  const updateSound = useCallback(
    (sound: SoundName) => engine.setSound(sound),
    [engine]
  );

  return {
    isPlaying,
    togglePlaying,
    updateBpm,
    updateSound,
    updateVolume,
    volume,
    beatIndex,
    error,
  };
}

export default useMetronome;
