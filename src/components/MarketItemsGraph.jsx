import React from "react";
import { Line } from "react-chartjs-2";
import * as zoom from "chartjs-plugin-zoom";
import { chartJsConfig, chartColors, chartDataset } from "../chartConfig";

// TODO: Refactor (and possibly use new Graphing Libraries) to Typescript-ify
class MarketItemsGraph extends React.Component {
  updateChart = () => {
    let chart = this.refs.chart.chartInstance;

    if (Object.keys(this.props.quotes).length === 0) {
      chart.data.datasets = [];
      return chart.update();
    }

    Object.keys(this.props.quotes).map((item_name, index) => {
      let current_item = this.props.quotes[item_name];
      let chart_dataset = chart.data.datasets.find((dataset) => {
        return dataset.label === item_name.toUpperCase();
      });

      if (current_item.is_selected) {
        let current_item = this.props.quotes[item_name];
        if (chart_dataset) {
          // only update the data, don't create a new dataset for the graph
          chart_dataset.data = this.getItemValues(current_item);
        } else {
          // create a new dataset for graph
          if (current_item) {
            chart.data.datasets = chart.data.datasets.concat([
              chartDataset(
                item_name,
                chartColors[index],
                this.getItemValues(current_item)
              ),
            ]);
          }
        }
      } else {
        if (chart_dataset) {
          // remove the dataset from graph
          chart.data.datasets.splice(
            chart.data.datasets.indexOf(chart_dataset),
            1
          );
        }
      }
      chart.update();
    });
  };

  componentDidUpdate = () => {
    this.updateChart();
  };

  // returns an array of objects, {t: timestamp, y: value}
  getItemValues = (quote) => {
    return quote.history.map((history) => {
      return { t: new Date(history.time), y: history.value };
    });
  };

  resetZoom = () => {
    this.refs.chart.chartInstance.resetZoom();
  };

  render() {
    return (
      <div className={"card column"}>
        <div className="card-header">
          <div className="card-header-title">Graph</div>
        </div>
        <div className="card-content">
          <p className="is-size-7 has-text-info">
            {this.refs.chart &&
            this.refs.chart.chartInstance.data.datasets.length > 0
              ? "Scroll/pinch to zoom, drag to pan."
              : "Click on any items on your left to see graphs."}
          </p>
          <button
            className="button is-small is-pulled-right"
            onClick={this.resetZoom}
          >
            Reset zoom
          </button>
          <Line data={{ datasets: [] }} options={chartJsConfig} ref="chart" />
        </div>
      </div>
    );
  }
}

export default MarketItemsGraph;
