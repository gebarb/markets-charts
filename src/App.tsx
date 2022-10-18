import React, { Component } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";
import UnsafeScriptsWarning from "./components/UnsafeScriptsWarning";

class App extends Component {
  state = {
    hasError: false,
    showSpinner: true,
  };

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    console.log("some error has occured");
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // You can also log the error to an error reporting service
    console.log(error, info);
  }

  hideSpinner = () => {
    this.setState({ showSpinner: false });
  };

  render() {
    if (this.state.hasError) {
      return <UnsafeScriptsWarning />;
    }
    return (
      <div className="App">
        <Dashboard
          hideSpinner={this.hideSpinner}
          showSpinner={this.state.showSpinner}
        />
      </div>
    );
  }
}

export default App;
