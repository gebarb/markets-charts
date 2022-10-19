import React from "react";
import { Detector } from "react-detect-offline";
import MarketItemRow from "./MarketItemRow";
import MarketTrendArrow from "./MarketTrendArrow";

const MarketItemsList = (props: {
  resetData: React.MouseEventHandler<HTMLButtonElement> | undefined;
  areMarketsLoaded: () => any;
  market_trend: string | undefined;
  quotes: any;
  toggleItemSelection: {
    bind: (
      arg0: undefined,
      arg1: any
    ) => React.MouseEventHandler<HTMLTableRowElement> | undefined;
  };
}) => {
  return (
    <div className="card column is-one-third" id="items_list">
      <div className="card-header">
        <div className="card-header-title">
          Markets &nbsp;
          <Detector
            render={({ online }: { online: any }) => (
              <span className={online ? "tag is-success" : "tag is-danger"}>
                {online ? "Live" : "Offline"}
              </span>
            )}
          />
          &nbsp;
          <button className="button is-small" onClick={props.resetData}>
            Clear history
          </button>
        </div>
      </div>
      <div className="card-content">
        {props.areMarketsLoaded() ? (
          <p className="is-size-7 has-text-info">
            Click on an item to add/remove from graph
          </p>
        ) : null}
        <table className="table is-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>
                Value
                <MarketTrendArrow current_trend={props.market_trend} />
              </th>
              <th>History</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(props.quotes).map((item_name, index) => {
              let current_item = props.quotes[item_name];
              return (
                <MarketItemRow
                  key={index}
                  item_name={item_name}
                  item_data={current_item}
                  toggleItemSelection={props.toggleItemSelection}
                />
              );
            })}
            {props.areMarketsLoaded() ? null : (
              <tr>
                <td colSpan={4}>No markets loaded yet!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketItemsList;
