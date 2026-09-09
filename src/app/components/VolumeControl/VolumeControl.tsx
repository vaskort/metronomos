import { Row, Col, Typography, Slider, InputNumber } from 'antd';
import { MAX_VOLUME } from '@utils/constants';

interface VolumeControlProps {
  updateVolume: (value: number) => void;
  volume: number;
}

const VolumeControl = ({ updateVolume, volume }: VolumeControlProps) => (
  <Row gutter={[16, 16]}>
    <Col style={{ textAlign: 'center' }} span={24}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Volume
      </Typography.Title>
      <InputNumber
        value={`${Math.round(volume * 100)}%`}
        controls={false}
        size="small"
        readOnly
        aria-label="Current volume"
      />
      <Slider
        min={0}
        max={MAX_VOLUME}
        step={0.01}
        value={volume}
        onChange={updateVolume}
        aria-label="Volume"
        tooltip={{
          formatter: (value?: number) => `${Math.round((value ?? 0) * 100)}%`,
        }}
      />
    </Col>
  </Row>
);

export default VolumeControl;
