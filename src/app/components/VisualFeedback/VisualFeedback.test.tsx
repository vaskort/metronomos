import { render } from '@testing-library/react';
import VisualFeedback from './VisualFeedback';
import { COLOURS } from '@utils/constants';

const circleFill = (container: HTMLElement) =>
  container.querySelector('circle')?.getAttribute('fill');

describe('VisualFeedback', () => {
  it('fills the circle while stopped rather than leaving it blank', () => {
    const { container } = render(
      <VisualFeedback
        color={COLOURS.PRIMARY}
        visualFeedback
        isPlaying={false}
      />
    );

    expect(circleFill(container)).toBe(COLOURS.PRIMARY);
  });

  it('shows the beat colour while playing', () => {
    const { container } = render(
      <VisualFeedback color={COLOURS.SECONDARY} visualFeedback isPlaying />
    );

    expect(circleFill(container)).toBe(COLOURS.SECONDARY);
  });

  it('hides the indicator without unmounting it', () => {
    const { container } = render(
      <VisualFeedback
        color={COLOURS.PRIMARY}
        visualFeedback={false}
        isPlaying
      />
    );

    expect(container.querySelector('svg')).toHaveStyle({
      visibility: 'hidden',
    });
  });
});
