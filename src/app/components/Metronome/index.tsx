import { useCallback, useEffect, useRef, useState } from 'react';
import useMetronome from '@hooks/useMetronome';
import useWakeLock from '@hooks/useWakeLock';
import {
  Row,
  Col,
  Button,
  InputNumber,
  message,
  Slider,
  Typography,
  Checkbox,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { MIN_BPM, INITIAL_BPM, MAX_BPM, COLOURS } from '@utils/constants';
import SoundSelector from '@components/SoundSelector';
import VisualFeedback from '@components/VisualFeedback/VisualFeedback';
import VolumeControl from '@components/VolumeControl/VolumeControl';

/** Taps further apart than this start a new measurement. */
const TAP_TIMEOUT_MS = 2000;

const Metronome = () => {
  const [inputBpm, setInputBpm] = useState(INITIAL_BPM);
  const {
    isPlaying,
    togglePlaying,
    updateBpm,
    updateSound,
    updateVolume,
    volume,
    beatIndex,
    error,
  } = useMetronome(INITIAL_BPM);
  const tapTimes = useRef<number[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [visualFeedback, setVisualFeedback] = useState(true);

  // beatIndex is -1 until the first beat lands, so the +1 keeps the resting
  // circle on the primary colour and lets the first beat flip it — matching
  // the desktop app, which seeded the colour and toggled from there.
  const color =
    (beatIndex + 1) % 2 === 0 ? COLOURS.PRIMARY : COLOURS.SECONDARY;

  // Mirrors inputBpm so the +/- buttons read the live tempo. Reading the state
  // variable instead means several clicks inside one render batch all see the
  // same stale value, and every click but the first is lost.
  const bpmRef = useRef(INITIAL_BPM);

  const handleInputBpmChange = useCallback(
    (value: number | null) => {
      if (value === null) return;
      const bpm = Math.min(Math.max(value, MIN_BPM), MAX_BPM);
      bpmRef.current = bpm;
      setInputBpm(bpm);
      updateBpm(bpm);
    },
    [updateBpm]
  );

  const nudgeBpm = useCallback(
    (delta: number) => handleInputBpmChange(bpmRef.current + delta),
    [handleInputBpmChange]
  );

  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimes.current;

    if (taps.length && now - taps[taps.length - 1] > TAP_TIMEOUT_MS) {
      taps.length = 0;
    }

    taps.push(now);
    // Average the last few intervals rather than using only the most recent
    // one, so a single uneven tap doesn't throw the tempo off.
    if (taps.length > 5) taps.shift();

    if (taps.length < 3) {
      messageApi.open({
        key: 'tap-tempo',
        type: 'info',
        content: 'Keep tapping to set the tempo...',
        duration: 2,
      });
      return;
    }

    const averageMs = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
    handleInputBpmChange(Math.round(60000 / averageMs));
  }, [handleInputBpmChange, messageApi]);

  useEffect(() => {
    if (error) {
      messageApi.open({ key: 'audio-error', type: 'error', content: error });
    }
  }, [error, messageApi]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;

      const target = event.target as HTMLElement | null;
      // Let the space bar do its normal job inside inputs.
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;

      // Otherwise it would scroll the page, and re-trigger any focused button.
      event.preventDefault();
      void togglePlaying();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlaying]);

  useWakeLock(isPlaying);

  return (
    <>
      {contextHolder}
        <VisualFeedback
          color={color}
          visualFeedback={visualFeedback}
          isPlaying={isPlaying}
        />
        <Row gutter={[16, 16]}>
          <Col style={{ textAlign: 'center' }} span={24}>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              BPM
            </Typography.Title>
            <InputNumber
              value={inputBpm}
              onChange={handleInputBpmChange}
              style={{ marginBottom: '20px' }}
              size="large"
              min={MIN_BPM}
              max={MAX_BPM}
              inputMode="numeric"
              aria-label="Beats per minute"
            />
          </Col>
          <Col span={3} sm={2}>
            <Button
              icon={<MinusOutlined />}
              onClick={() => nudgeBpm(-1)}
              aria-label="Decrease tempo"
              block
            />
          </Col>
          <Col span={18} sm={20}>
            <Slider
              min={MIN_BPM}
              max={MAX_BPM}
              value={inputBpm}
              onChange={handleInputBpmChange}
              aria-label="Tempo"
            />
          </Col>
          <Col span={3} sm={2}>
            <Button
              icon={<PlusOutlined />}
              onClick={() => nudgeBpm(1)}
              aria-label="Increase tempo"
              block
            />
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Button
              type="primary"
              onClick={() => void togglePlaying()}
              icon={
                isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />
              }
              size="large"
              block
            >
              {isPlaying ? 'Stop Metronome' : 'Start Metronome'}
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Button
              type="primary"
              size="large"
              className="tap-tempo"
              onPointerDown={handleTapTempo}
              block
            >
              Tap Tempo
            </Button>
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: 'center' }}>
            <SoundSelector onSoundChange={updateSound} />
          </Col>
          <Col xs={24} sm={12} style={{ alignSelf: 'center' }}>
            <Checkbox
              checked={!visualFeedback}
              onChange={() => setVisualFeedback((shown) => !shown)}
            >
              Hide Visual Feedback
            </Checkbox>
          </Col>
          <Col span={24}>
            <VolumeControl updateVolume={updateVolume} volume={volume} />
          </Col>
        </Row>
      </>
  );
};

export default Metronome;
