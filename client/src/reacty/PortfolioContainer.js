import React from 'react';

import ShowPieChart from './PieChart';
import coinPricesJson from "./../coinmarketcap-2018-7-31-19.json"
// import tokenContractsJson from "./../tokens.json";
import tokenContractsJson from "./../testnetTokens.json";

import {getCoinPrices, getCurrentAssets, computeTrades} from "./Helpers"
import {startTrade, getMarketInformation} from "./KyberInterface"
import AssetSlider from './AssetSlider';


//https://codesandbox.io/s/9o3l3pr1np?from-embed


async function getInfo() {
  var supportedTokens = await getMarketInformation('AVAIL_TOKENS');
  var tokenPriceInfo = await getMarketInformation('PRICE_INFO');
  var info = []
  info.push(supportedTokens);
  info.push(tokenPriceInfo);
  return info;
}

class PortfolioContainer extends React.Component {
    constructor(props) {
      super(props)
  
      this.state = {
        assets: [],
        coinPricesMap : {},
        drizzle : {},
        drizzleState : {}
      }
    }
    
    
    componentDidMount() {
        const { drizzle, drizzleState } = this.props;
        this.setState({ drizzle: drizzle });
        this.setState({ drizzleState: drizzleState });

        var recentCoinPricesMap = getCoinPrices(coinPricesJson);
        // var supportedTokens = getMarketInformation('AVAIL_TOKENS');
        // var tokenPriceInfo = await getMarketInformation('PRICE_INFO');

        getInfo().then(info => getCurrentAssets(drizzle, drizzleState, tokenContractsJson, info[0], info[1], this))
        // console.log(supportedTokens);
        // console.log(tokenPriceInfo);

        this.setState({coinPricesMap :recentCoinPricesMap })

        console.log("DEBUG? " + recentCoinPricesMap.get('ETH'));
        
        // getCurrentAssets(drizzle, drizzleState, tokenContractsJson, recentCoinPricesMap, this)
    }

    

    addAsset(asset) {
        console.log('add asset called')
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
    }

    changeSlider = (asset, value) => {
        console.log('SLIDER CHANGE ' + asset.symbol + ' event ' + value);

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
        } else 
        {
          asset.newPortfolioPercent = value;
        }

        asset.newPercentUsdValue = totalUsdValue * (asset.newPortfolioPercent * .01)
        // This is needed, but not sure why..
        this.setState({ assets: this.state.assets });
    }

    startKyberTrade = () => {
      console.log('trade start button clicked');
      computeTrades(this.state.assets);
      //startTrade(this.state.drizzleState, this.state.drizzle);
    }

    render() {
      return (
        <div>
          <h3> Portfolio Container  </h3>
          <ShowPieChart assets = {this.state.assets} />
          <AssetSlider changeSlider = {this.changeSlider} assets = {this.state.assets} />
          <button onClick={this.startKyberTrade}>
            Start Trade!
          </button>
        </div>
      )
    }
  }

  export default PortfolioContainer;