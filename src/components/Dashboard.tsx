import React from "react";
import "bulma/css/bulma.css";
import StocksList from "./StocksList";
import StocksGraph from "./StocksGraph";
import StocksLoaderStatus from "./StocksLoaderStatus";
import SpinnerProps from "../models/spinnerProps";
import StockState from "../models/stocks";

// Insecure WebSocket ONLY
//const stocksUrl = "ws://stocks.mnet.website/";

// https://eodhistoricaldata.com/financial-apis/new-real-time-data-api-websockets/
const stocksUrl = "wss://ws.eodhistoricaldata.com/ws/us?api_token=demo";
const forexUrl = "wss://ws.eodhistoricaldata.com/ws/forex?api_token=demo";
//const cryptoUrl = "wss://ws.eodhistoricaldata.com/ws/crypto?api_token=demo";

class Dashboard extends React.Component<SpinnerProps, StockState> {
  stocksConnection!: WebSocket;
  forexConnection!: WebSocket;
  cryptoConnection!: WebSocket;

  state: StockState = {
    // stocks = {name: {current_value: 12, history: [{time: '2131', value: 45}, ...], is_selected: false}, ...}
    stocks: {},
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
    this.stocksConnection.onmessage = this.saveNewStockValues;
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
    this.forexConnection.onmessage = this.saveNewStockValues;
    this.forexConnection.onclose = () => {
      this.setState({ connectionError: true });
    };

    // this.cryptoConnection = new WebSocket(cryptoUrl);
    // this.cryptoConnection.onopen = () => {
    //   this.cryptoConnection.send(
    //     new Blob(
    //       [
    //         JSON.stringify({
    //           action: "subscribe",
    //           symbols: "ETH-USD, BTC-USD",
    //         }),
    //       ],
    //       {
    //         type: "application/json",
    //       }
    //     )
    //   );
    // };
    // this.cryptoConnection.onmessage = this.saveNewStockValues;
    // this.cryptoConnection.onclose = () => {
    //   this.setState({ connectionError: true });
    // };
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

    // this.cryptoConnection.send(
    //   new Blob(
    //     [
    //       JSON.stringify({
    //         action: "unsubscribe",
    //         symbols: "ETH-USD, BTC-USD",
    //       }),
    //     ],
    //     {
    //       type: "application/json",
    //     }
    //   )
    // );
  };

  saveNewStockValues = (event: { data: string }) => {
    this.props.hideSpinner();
    let result = JSON.parse(event.data);
    let [up_values_count, down_values_count] = [0, 0];

    // time stored in histories should be consistent across stocks
    let current_time = Date.now();
    let new_stocks = this.state.stocks;
    // Logic for ws.eodhistoricaldata.com
    const ticker: string = result.s;
    const val: number = result.p ? result.p : result.a;
    if (ticker && val) {
      if (this.state.stocks[ticker]) {
        new_stocks[ticker].current_value > Number(val)
          ? up_values_count++
          : down_values_count++;

        new_stocks[ticker].current_value = Number(val);
        new_stocks[ticker].history.push({
          time: current_time,
          value: Number(val),
        });
      } else {
        new_stocks[ticker] = {
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
    //     new_stocks[stock[0]].current_value > Number(stock[1])
    //       ? up_values_count++
    //       : down_values_count++;

    //     new_stocks[stock[0]].current_value = Number(stock[1]);
    //     new_stocks[stock[0]].history.push({
    //       time: current_time,
    //       value: Number(stock[1]),
    //     });
    //   } else {
    //     new_stocks[stock[0]] = {
    //       current_value: stock[1],
    //       history: [{ time: Date.now(), value: Number(stock[1]) }],
    //       is_selected: false,
    //     };
    //   }
    // });
    this.setState({
      stocks: new_stocks,
      market_trend: this.newMarketTrend(up_values_count, down_values_count),
    });
  };

  // it's about the values that just came in, and not all the stocks
  newMarketTrend = (up_count: number, down_count: number) => {
    if (up_count === down_count) return undefined;
    return up_count > down_count ? "up" : "down";
  };

  toggleStockSelection = (stock_name: string | number) => {
    let new_stocks = this.state.stocks;
    new_stocks[stock_name].is_selected = !new_stocks[stock_name].is_selected;
    this.setState({ stocks: new_stocks });
  };

  resetData = () => {
    let new_stocks = this.state.stocks;
    Object.keys(this.state.stocks).map((stock_name, index) => {
      new_stocks[stock_name].history = [new_stocks[stock_name].history.pop()];
    });
    this.setState({ stocks: new_stocks });
  };

  areStocksLoaded = () => {
    return Object.keys(this.state.stocks).length > 0;
  };

  render() {
    return (
      <div className="container">
        <div className="columns">
          <StocksList
            stocks={this.state.stocks}
            toggleStockSelection={this.toggleStockSelection}
            resetData={this.resetData}
            market_trend={this.state.market_trend}
            areStocksLoaded={this.areStocksLoaded}
          />
          <StocksGraph stocks={this.state.stocks} />
        </div>
        <div className={this.props.showSpinner ? "modal is-active" : "modal"}>
          <div className="modal-background" />
          <div className="modal-content">
            <StocksLoaderStatus connectionError={this.state.connectionError} />
          </div>
        </div>
      </div>
    );
  }
}

export default Dashboard;
