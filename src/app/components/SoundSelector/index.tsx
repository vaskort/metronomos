import { useState } from 'react';
import { Radio, type RadioChangeEvent } from 'antd';
import type { SoundName } from '@audio/types';

interface SoundSelectorProps {
  onSoundChange: (sound: SoundName) => void;
}

const sounds: { label: string; value: SoundName }[] = [
  { label: 'Low Pitch', value: 'low' },
  { label: 'High Pitch', value: 'high' },
];

const SoundSelector = ({ onSoundChange }: SoundSelectorProps) => {
  const [selectedSound, setSelectedSound] = useState<SoundName>('low');

  const handleChange = (e: RadioChangeEvent) => {
    const value = e.target.value as SoundName;
    setSelectedSound(value);
    onSoundChange(value);
  };

  return (
    <Radio.Group
      className="sound-selector"
      options={sounds}
      onChange={handleChange}
      value={selectedSound}
      optionType="button"
      aria-label="Click sound"
    />
  );
};

export default SoundSelector;
