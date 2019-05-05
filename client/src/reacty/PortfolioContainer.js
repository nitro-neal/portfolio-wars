import React from 'react';
import ShowPieChart from './PieChart';
import coinPricesJson from "./../coinmarketcap-2018-7-31-19.json"
// import tokenContractsJson from "./../tokens.json";
import tokenContractsJson from "./../testnetTokens.json";
import {getCoinPrices, getCurrentAssets} from "./Helpers"
import AssetSlider from './AssetSlider';


//https://codesandbox.io/s/9o3l3pr1np?from-embed

class PortfolioContainer extends React.Component {
    constructor(props) {
      super(props)
  
      this.state = {
        assets: [],
        coinPricesMap : {}
      }
    }
    
    componentDidMount() {
        const { drizzle, drizzleState } = this.props;

        var recentCoinPricesMap = getCoinPrices(coinPricesJson);
        this.setState({coinPricesMap :recentCoinPricesMap })

        console.log("DEBUG? " + recentCoinPricesMap.get('ETH'));
        getCurrentAssets(drizzle, drizzleState, tokenContractsJson, recentCoinPricesMap, this)        
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
        }

        this.setState({ assets: currentAssets });
    }

    changeSlider = (asset, value) => {
        console.log('SLIDER CHANGE ' + asset.symbol + ' event ' + value);

        asset.currentPortfolioPercent = value;

        var totalPercentage = 0;
        for(var i = 0; i < this.state.assets.length; i ++) {
          totalPercentage += this.state.assets[i].currentPortfolioPercent;
        }

        if(totalPercentage > 100) {
          asset.currentPortfolioPercent = value - (totalPercentage - 100) ;
        } else 
        {
          asset.currentPortfolioPercent = value;
        }

        // This is needed, but not sure why..
        this.setState({ assets: this.state.assets });
    }

    render() {
      return (
        <div>
          <h3> Portfolio Container  </h3>
          <ShowPieChart assets = {this.state.assets} />
          <AssetSlider changeSlider = {this.changeSlider} assets = {this.state.assets} />
        </div>
      )
    }
  }

  export default PortfolioContainer;