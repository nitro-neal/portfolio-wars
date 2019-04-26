import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ReadString from "./ReadString";
import SetString from "./SetString";
import ReadCoins from "./ReadCoins";
import PortfolioManager from "./PortfolioManager"
import ZeroXIntegration from './ZeroXIntegration';
import KyberIntegration from './KyberIntegration';
import KyberBatchIntegration from './KyberBatchIntegration';
import EasyPortfolio from './EasyPortfolio';


class App extends Component {
  state = { loading: true, drizzleState: null };

  componentDidMount() {
    const { drizzle } = this.props;

    // subscribe to changes in the store
    this.unsubscribe = drizzle.store.subscribe(() => {

      // every time the store updates, grab the state from drizzle
      const drizzleState = drizzle.store.getState();

      // check to see if it's ready, if so, update local component state
      if (drizzleState.drizzleStatus.initialized) {
        this.setState({ loading: false, drizzleState });
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    if (this.state.loading) return "Loading Drizzle...";
    return (
      <div className="App">
        {/* <ReadString
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}
        />
        <SetString
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}
        />
        <ReadCoins
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}
        /> */}


        {/* <PortfolioManager/> */}
        {/* <KyberIntegration
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}
        /> */}
        {/* <KyberBatchIntegration
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}
        /> */}

        <EasyPortfolio
          drizzle={this.props.drizzle}
          drizzleState={this.state.drizzleState}
        />
        
      </div>
    );
  }
}

export default App;
