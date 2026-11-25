const MarketTrendArrow = (props: { current_trend: string | undefined }) => {
  const getArrow = () => {
    if (props.current_trend === 'up') {
      return <span className="text-green-500">&#8679;</span>;
    } else if (props.current_trend === 'down') {
      return <span className="text-red-500">&#8681;</span>;
    }
    return '-';
  };

  return (
    <span
      title="Market trend"
      className="ml-1 inline-flex rounded bg-muted px-1"
    >
      {getArrow()}
    </span>
  );
};

export default MarketTrendArrow;
