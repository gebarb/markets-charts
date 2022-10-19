import React from "react";

const MarketsLoaderStatus = (props: { connectionError: any }) => {
  if (props.connectionError) {
    return (
      <div className="is-medium">
        <span className="has-text-danger">
          Server sent no data. The market is closed at the moment.{" "}
        </span>
        <br />
        (Come back later? :-)
      </div>
    );
  } else {
    return (
      <div className="tag is-large is-success">
        <span className="loader"> &nbsp;</span>
        &nbsp; &nbsp; Fetching some market data...
      </div>
    );
  }
};

export default MarketsLoaderStatus;
