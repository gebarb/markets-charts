import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MarketTrendArrow from '../MarketTrendArrow';

describe('MarketTrendArrow', () => {
  it('should render up arrow when trend is up', () => {
    const { container } = render(<MarketTrendArrow current_trend="up" />);
    const arrow = container.querySelector('[title="Market trend"] span');

    expect(arrow).toBeInTheDocument();
    expect(arrow).toHaveClass('text-green-500');
    expect(arrow?.textContent).toBe('⇧');
  });

  it('should render down arrow when trend is down', () => {
    const { container } = render(<MarketTrendArrow current_trend="down" />);
    const arrow = container.querySelector('[title="Market trend"] span');

    expect(arrow).toBeInTheDocument();
    expect(arrow).toHaveClass('text-red-500');
    expect(arrow?.textContent).toBe('⇩');
  });

  it('should render dash when trend is undefined', () => {
    const { container } = render(
      <MarketTrendArrow current_trend={undefined} />,
    );
    const arrow = container.querySelector('[title="Market trend"]');

    expect(arrow).toBeInTheDocument();
    expect(arrow?.textContent).toBe('-');
  });
});
