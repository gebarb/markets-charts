import React from "react";

const MarketTrendArrow = (props: { current_trend: string | undefined }) => {
  const getArrow = () => {
    if (props.current_trend === "up") {
      return <span className="up-arrow">&#8679;</span>;
    } else if (props.current_trend === "down") {
      return <span className="down-arrow">&#8681;</span>;
    } else {
      return "-";
    }
  };

  return (
    <span title="Market trend" className={"icon market-trend"}>
      {getArrow()}
    </span>
  );
};

export default MarketTrendArrow;
