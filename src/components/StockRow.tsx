import React from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";
import TimeAgo from "react-timeago";

const StockRow = (props: {
  stock_data: { history: any; is_selected?: any; current_value: any };
  stock_name: string | undefined;
  toggleStockSelection: {
    bind: (
      arg0: undefined,
      arg1: any
    ) => React.MouseEventHandler<HTMLTableRowElement> | undefined;
  };
}) => {
  const getStockValueColor = (stock: {
    current_value: number;
    history: { value: number }[];
  }) => {
    if (stock.current_value < stock.history.slice(-2)[0].value) {
      return "red";
    } else if (stock.current_value > stock.history.slice(-2)[0].value) {
      return "green";
    } else {
      return undefined;
    }
  };

  let history = props.stock_data.history;
  return (
    <tr
      className={props.stock_data.is_selected ? "selected" : undefined}
      id={props.stock_name}
      onClick={props.toggleStockSelection.bind(this, props.stock_name)}
    >
      <td>{props.stock_name ? props.stock_name.toUpperCase() : ""}</td>
      <td className={getStockValueColor(props.stock_data)}>
        {props.stock_data.current_value.toFixed(2)}
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

export default StockRow;
