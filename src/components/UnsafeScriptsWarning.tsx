import React from "react";

const UnsafeScriptsWarning = () => {
  return (
    <div className="container markets-loader">
      <div className="card-header">
        <div className="card-header-icon">
          <span className="loader" />
        </div>
        <div className="card-header-title">Loading...</div>
      </div>
      <div className="card">
        <div className="card-content">
          You need to click on &nbsp;<code>Load Unsafe Scripts</code>&nbsp; to
          proceed.
          <br /> Look for the &nbsp;<code>shield icon</code>&nbsp; on your
          browser's address bar. &#8679;
          <br />
        </div>
      </div>
    </div>
  );
};

export default UnsafeScriptsWarning;
