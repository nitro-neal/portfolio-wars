
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React from "react";
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
//import SimpleUtils from "./SimpleUtils";
import { Chart } from "react-google-charts";
// import tokenContractsJson from "./tokens.json";
import tokenContractsJson from "./testnetTokens.json";
import coinPricesJson from "./coinmarketcap-2018-7-31-19.json"

const Handle = Slider.Handle;
const wrapperStyle = { width: 400, margin: 50 };

class EasyPortfolio extends React.Component {
  state = { mydata: [['Coins', 'Amount']] };
  
  componentDidMount() {
    const { drizzle, drizzleState } = this.props;
    var coinPriceMap = new Map();
    let minABI = [
        // balanceOf
        {
          "constant":true,
          "inputs":[{"name":"_owner","type":"address"}],
          "name":"balanceOf",
          "outputs":[{"name":"balance","type":"uint256"}],
          "type":"function"
        },
        // decimals
        {
          "constant":true,
          "inputs":[],
          "name":"decimals",
          "outputs":[{"name":"","type":"uint8"}],
          "type":"function"
        }
      ];
      
    function getCoinPrices() {
        console.log(coinPricesJson)
        for(var i = 0; i < coinPricesJson.length; i++) {
            coinPriceMap.set(coinPricesJson[i].symbol, parseFloat(coinPricesJson[i].price_usd));
        }
    }

    function getTokenBalanceWithLoop(that) {

      //first get eth balance
      var balance = drizzleState.accountBalances[drizzleState.accounts[0]]
      var ethBalance = drizzle.web3.utils.fromWei(balance, 'ether');
    
      var arrayToAdd = [];
      arrayToAdd.push('ETH');
      arrayToAdd.push(parseFloat(ethBalance) * coinPriceMap.get('ETH'));
      that.setState({ mydata: [...that.state.mydata, arrayToAdd] });
      console.log(that.drizzleState);

      for(var i = 0; i < tokenContractsJson.length; i++) {
          var symbol = tokenContractsJson[i].symbol;
          var symbolTokenAddress = tokenContractsJson[i].address;
          console.log(symbol + " -> "  + symbolTokenAddress);

          let tokenContract = new drizzle.web3.eth.Contract(minABI, symbolTokenAddress);
          web3Call(symbol,symbolTokenAddress,tokenContract,that)
      }
    }

    function web3Call(symbol,symbolTokenAddress,tokenContract,that) {
      drizzle.web3.eth.call({
          to: symbolTokenAddress,
          data: tokenContract.methods.balanceOf(drizzleState.accounts[0]).encodeABI()
      }).then(balance => {
          //console.log(drizzle.web3.utils.toBN(balance).toString())
          drizzle.web3.eth.call({
              to: symbolTokenAddress,
              data: tokenContract.methods.decimals().encodeABI()
          }).then(decimals => {
              //console.log(drizzle.web3.utils.toBN(decimals).toString())
              var smallNum = drizzle.web3.utils.toBN(10).pow(drizzle.web3.utils.toBN(decimals))
              var finalTokenAmount = drizzle.web3.utils.toBN(balance).div(smallNum)
          
              console.log(finalTokenAmount.toString());

              if(parseFloat(finalTokenAmount.toString()) > 0.0000001) {
                  console.log("Non Zero Balance")
                  
                  console.log(symbol + " -> "  + finalTokenAmount.toString());
                  var arrayToAdd = [];
                  arrayToAdd.push(symbol);
                  arrayToAdd.push(parseFloat(finalTokenAmount.toString()) * coinPriceMap.get(symbol));
                  that.setState({ mydata: [...that.state.mydata, arrayToAdd] });

                  console.log(that.state.mydata);
              }
          })
      })
    }

    getCoinPrices();
    getTokenBalanceWithLoop(this);
  }

  render() {
    return (
        <div>
            <div>
                <Chart
                    width={'500px'}
                    height={'300px'}
                    chartType="PieChart"
                    loader={<div>Loading Chart</div>}
                    data={this.state.mydata}
                    options={{
                        title: 'Current Portfolio',
                    }}
                    rootProps={{ 'data-testid': '1' }}
                    />
            </div>
        </div>
    )
  }
}

export default EasyPortfolio;