import { Row, Col } from 'antd';

interface VisualFeedbackProps {
  color: string;
  visualFeedback: boolean;
  isPlaying: boolean;
}

const VisualFeedback = ({
  color,
  visualFeedback,
  isPlaying,
}: VisualFeedbackProps) => (
  <Row gutter={[16, 16]} style={{ justifyContent: 'center' }}>
    <Col style={{ textAlign: 'center' }}>
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={isPlaying ? 'Beat indicator, playing' : 'Beat indicator'}
        style={{
          width: 'min(28vw, 100px)',
          height: 'min(28vw, 100px)',
          visibility: visualFeedback ? 'visible' : 'hidden',
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="3"
          fill={color}
        />
      </svg>
    </Col>
  </Row>
);

export default VisualFeedback;
