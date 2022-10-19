import React from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";
import TimeAgo from "react-timeago";

const MarketItemRow = (props: {
  item_data: { history: any; is_selected?: any; current_value: number };
  item_name: string | undefined;
  toggleItemSelection: {
    bind: (
      arg0: undefined,
      arg1: any
    ) => React.MouseEventHandler<HTMLTableRowElement> | undefined;
  };
}) => {
  const getQuoteValueColor = (quote: {
    current_value: number;
    history: { value: number }[];
  }) => {
    if (quote.current_value < quote.history.slice(-2)[0].value) {
      return "red";
    } else if (quote.current_value > quote.history.slice(-2)[0].value) {
      return "green";
    } else {
      return undefined;
    }
  };

  let history = props.item_data.history;
  return (
    <tr
      className={props.item_data.is_selected ? "selected" : undefined}
      id={props.item_name}
      onClick={props.toggleItemSelection.bind(this, props.item_name)}
    >
      <td>{props.item_name ? props.item_name.toUpperCase() : ""}</td>
      <td className={getQuoteValueColor(props.item_data)}>
        {props.item_data.current_value.toFixed(2)}
      </td>
      <td>
        <Sparklines
          data={history.map((history: { value: any }) => {
            return history.value;
          })}
        >
          <SparklinesLine color="blue" />
        </Sparklines>
      </td>
      <td className="updated_at">
        <TimeAgo date={history.slice(-1)[0].time} />
      </td>
    </tr>
  );
};

export default MarketItemRow;
