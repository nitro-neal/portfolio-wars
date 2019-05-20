import React from 'react';

import ShowPieChart from './PieChart';
import {getCurrentAssets, computeTrades} from "./Helpers"
import {startTrade, getMarketInformation} from "./KyberInterface"
import AssetSlider from './AssetSlider';

var globalPriceInfo = {};

async function fetchPriceInfo() {
  var supportedTokens = await getMarketInformation('AVAIL_TOKENS');
  var tokenPriceInfo = await getMarketInformation('PRICE_INFO');

  console.log('Supported tokens: ');
  console.log(supportedTokens)

  console.log('Price info: ');
  console.log(tokenPriceInfo)

  globalPriceInfo = tokenPriceInfo;
  return tokenPriceInfo;
}

class PortfolioContainer extends React.Component {
    constructor(props) {
      super(props)
  
      this.state = {
        assets: [],
        totalUsdValue: 0,
        tradeComplete : 0,
        drizzle : {},
        drizzleState : {}
      }
    }
    
    componentDidMount() {
        const { drizzle, drizzleState } = this.props;
        this.setState({ drizzle: drizzle });
        this.setState({ drizzleState: drizzleState });
        fetchPriceInfo().then(priceInfo => getCurrentAssets(drizzle, drizzleState, priceInfo, this))   
    }

    addAsset(asset) {
        this.computeNewPercentages(asset)
    }

    computeNewPercentages(asset) {
        var currentAssets = this.state.assets;
        currentAssets.push(asset);

        var totalUsdValue = 0;
        for(var i = 0; i < currentAssets.length; i ++) {
          totalUsdValue += currentAssets[i].usdValue;
        }

        for(var j = 0; j < currentAssets.length; j++) {
            currentAssets[j].currentPortfolioPercent = ((currentAssets[j].usdValue / totalUsdValue) * 100.0);
            currentAssets[j].newPortfolioPercent = ((currentAssets[j].usdValue / totalUsdValue) * 100.0);
        }

        this.setState({ assets: currentAssets });
        this.setState({totalUsdValue : totalUsdValue})
    }

    changeSlider = (asset, value) => {
        // needed so it doesn't 'jump'
        asset.newPortfolioPercent = value;

        var totalPercentage = 0;
        var totalUsdValue = 0;
        for(var i = 0; i < this.state.assets.length; i ++) {
          totalPercentage += this.state.assets[i].newPortfolioPercent;
          totalUsdValue += this.state.assets[i].usdValue
        }

        if(totalPercentage > 100) {
          asset.newPortfolioPercent = value - (totalPercentage - 100) ;
        } else {
          asset.newPortfolioPercent = value;
        }

        asset.newPercentUsdValue = totalUsdValue * (asset.newPortfolioPercent * .01)
        // this is needed, but not sure why..
        this.setState({ assets: this.state.assets });
    }

    startKyberTrade = () => {
      var trades = computeTrades(this.state.assets);
      console.log('Performing trades: ');
      console.log(trades)
      startTrade(this.state.drizzleState, this.state.drizzle, this.tradeCompleteCallback, trades);
    }

    handleKeyDown = e => {
      if (e.keyCode === 13) {
        var token = 'ETH_' + e.target.value;
        var asset =  {"symbol" : e.target.value, "tokenAddress" :  globalPriceInfo[token].token_address, "amount" : 0, "pricePerAsset":globalPriceInfo[token].rate_usd_now, "usdValue": 0, "newPercentUsdValue": 0, "currentPortfolioPercent" : 0, "newPortfolioPercent" : 0}
        this.addAsset(asset)
      }
    };

    tradeCompleteCallback = hash => {
      console.log('TRADE COMPLETE');
      console.log(hash);
      this.setState({tradeComplete : 1})
    }

    render() {
      var tradesComplete = false;
      if(this.state.tradeComplete != 0) {
        tradesComplete = true;
      }
      return (
        <div>
          {tradesComplete == true && <h2>Trade Complete!</h2>}
          <h3> Portfolio Container </h3>          
          <p> Total USD Value: {this.state.totalUsdValue} </p>
          <ShowPieChart assets = {this.state.assets} />
          <input type="text" onKeyDown={this.handleKeyDown} />
          <AssetSlider changeSlider = {this.changeSlider} assets = {this.state.assets} />
          <button onClick={this.startKyberTrade}>
            Start Trade!
          </button>
        </div>
      )
    }
  }

  export default PortfolioContainer;