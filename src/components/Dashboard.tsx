import React from "react";
import "bulma/css/bulma.css";
import MarketItemsList from "./MarketItemsList";
import MarketItemsGraph from "./MarketItemsGraph";
import MarketsLoaderStatus from "./MarketsLoaderStatus";
import SpinnerProps from "../models/spinnerProps";
import MarketItemState from "../models/marketItems";

// Insecure WebSocket ONLY
//const stocksUrl = "ws://stocks.mnet.website/";

// https://eodhistoricaldata.com/financial-apis/new-real-time-data-api-websockets/
const stocksUrl = "wss://ws.eodhistoricaldata.com/ws/us?api_token=demo";
const forexUrl = "wss://ws.eodhistoricaldata.com/ws/forex?api_token=demo";
// https://docs.cloud.coinbase.com/exchange/docs/websocket-overview
const cryptoUrl = "wss://ws-feed.pro.coinbase.com";

class Dashboard extends React.Component<SpinnerProps, MarketItemState> {
  stocksConnection!: WebSocket;
  forexConnection!: WebSocket;
  cryptoConnection!: WebSocket;

  state: MarketItemState = {
    // quotes = {name: {current_value: 12, history: [{time: '2131', value: 45}, ...], is_selected: false}, ...}
    quotes: {},
    market_trend: undefined, // 'up' or 'down'
    connectionError: false,
  };

  componentDidMount = () => {
    this.stocksConnection = new WebSocket(stocksUrl);
    this.stocksConnection.onopen = () => {
      this.stocksConnection.send(
        new Blob(
          [
            JSON.stringify({
              action: "subscribe",
              symbols: "AAPL, AMZN, TSLA, MSFT",
            }),
          ],
          {
            type: "application/json",
          }
        )
      );
    };
    this.stocksConnection.onmessage = this.saveNewItemValues;
    this.stocksConnection.onclose = () => {
      this.setState({ connectionError: true });
    };

    this.forexConnection = new WebSocket(forexUrl);
    this.forexConnection.onopen = () => {
      this.forexConnection.send(
        new Blob(
          [
            JSON.stringify({
              action: "subscribe",
              symbols: "EURUSD",
            }),
          ],
          {
            type: "application/json",
          }
        )
      );
    };
    this.forexConnection.onmessage = this.saveNewItemValues;
    this.forexConnection.onclose = () => {
      this.setState({ connectionError: true });
    };

    this.cryptoConnection = new WebSocket(cryptoUrl);
    this.cryptoConnection.onopen = () => {
      this.cryptoConnection.send(
        new Blob(
          [
            JSON.stringify({
              type: "subscribe",
              product_ids: ["ETH-USD", "BTC-USD"],
              channels: [
                "heartbeat",
                {
                  name: "ticker",
                  product_ids: ["ETH-USD", "BTC-USD"],
                },
              ],
            }),
          ],
          {
            type: "application/json",
          }
        )
      );
    };
    this.cryptoConnection.onmessage = this.saveNewItemValues;
    this.cryptoConnection.onclose = () => {
      this.setState({ connectionError: true });
    };
  };

  componentWillUnmount = () => {
    this.stocksConnection.send(
      new Blob(
        [
          JSON.stringify({
            action: "unsubscribe",
            symbols: "AAPL, AMZN, TSLA, MSFT",
          }),
        ],
        {
          type: "application/json",
        }
      )
    );

    this.forexConnection.send(
      new Blob(
        [
          JSON.stringify({
            action: "unsubscribe",
            symbols: "EURUSD",
          }),
        ],
        {
          type: "application/json",
        }
      )
    );

    this.cryptoConnection.send(
      new Blob(
        [
          JSON.stringify({
            type: "unsubscribe",
            product_ids: ["ETH-USD", "BTC-USD"],
            channels: [
              "heartbeat",
              {
                name: "ticker",
                product_ids: ["ETH-USD", "BTC-USD"],
              },
            ],
          }),
        ],
        {
          type: "application/json",
        }
      )
    );
  };

  saveNewItemValues = (event: { data: string }) => {
    this.props.hideSpinner();
    let result = JSON.parse(event.data);
    let [up_values_count, down_values_count] = [0, 0];

    // time stored in histories should be consistent across market items
    let current_time = Date.now();
    let new_items = this.state.quotes;
    // Logic for ws.eodhistoricaldata.com
    const ticker: string = result.s ? result.s : result.product_id;
    const val: number = result.p
      ? result.p
      : result.a
      ? result.a
      : parseFloat(result.price);
    if (ticker && val) {
      if (this.state.quotes[ticker]) {
        new_items[ticker].current_value > Number(val)
          ? up_values_count++
          : down_values_count++;

        new_items[ticker].current_value = Number(val);
        new_items[ticker].history.push({
          time: current_time,
          value: Number(val),
        });
      } else {
        new_items[ticker] = {
          current_value: val,
          history: [{ time: Date.now(), value: Number(val) }],
          is_selected: false,
        };
      }
    }
    // Logic for stocks.mnet.website
    //
    // result.map((stock: any) => {
    //   // stock = ['name', 'value']
    //   if (this.state.stocks[stock[0]]) {
    //     new_items[stock[0]].current_value > Number(stock[1])
    //       ? up_values_count++
    //       : down_values_count++;

    //     new_items[stock[0]].current_value = Number(stock[1]);
    //     new_items[stock[0]].history.push({
    //       time: current_time,
    //       value: Number(stock[1]),
    //     });
    //   } else {
    //     new_items[stock[0]] = {
    //       current_value: stock[1],
    //       history: [{ time: Date.now(), value: Number(stock[1]) }],
    //       is_selected: false,
    //     };
    //   }
    // });
    this.setState({
      quotes: new_items,
      market_trend: this.newMarketTrend(up_values_count, down_values_count),
    });
  };

  // it's about the values that just came in, and not all of them
  newMarketTrend = (up_count: number, down_count: number) => {
    if (up_count === down_count) return undefined;
    return up_count > down_count ? "up" : "down";
  };

  toggleItemSelection = (item_name: string | number) => {
    let new_items = this.state.quotes;
    new_items[item_name].is_selected = !new_items[item_name].is_selected;
    this.setState({ quotes: new_items });
  };

  resetData = () => {
    let new_items = this.state.quotes;
    Object.keys(this.state.quotes).map((item_name, index) => {
      new_items[item_name].history = [new_items[item_name].history.pop()];
    });
    this.setState({ quotes: new_items });
  };

  areMarketsLoaded = () => {
    return Object.keys(this.state.quotes).length > 0;
  };

  render() {
    return (
      <div className="container">
        <div className="columns">
          <MarketItemsList
            quotes={this.state.quotes}
            toggleItemSelection={this.toggleItemSelection}
            resetData={this.resetData}
            market_trend={this.state.market_trend}
            areMarketsLoaded={this.areMarketsLoaded}
          />
          <MarketItemsGraph quotes={this.state.quotes} />
        </div>
        <div className={this.props.showSpinner ? "modal is-active" : "modal"}>
          <div className="modal-background" />
          <div className="modal-content">
            <MarketsLoaderStatus connectionError={this.state.connectionError} />
          </div>
        </div>
      </div>
    );
  }
}

export default Dashboard;
