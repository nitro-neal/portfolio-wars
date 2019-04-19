
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React from "react";
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import { Chart } from "react-google-charts";
import tokenContractsJson from "./tokens.json";
import coinPricesJson from "./coinmarketcap-2018-7-31-19.json"

//const createSliderWithTooltip = Slider.createSliderWithTooltip;
//const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;
const wrapperStyle = { width: 400, margin: 50 };


var handle = (props) => {
  const { balance, value, dragging, index, ...restProps } = props;

   var myNewchart = ['lol' + value, value]

   //that.setState({ myIdealBalance: [...that.state.myIdealBalance, myNewchart] });
    //this.setState({myIdealBalance: 'X'})
    console.log(props);
    console.log("blaance?")
    console.log(balance)

  return (

    <>
    {/* // this.setState({ myIdealBalance: [...this.state.myIdealBalance, myNewchart] }); */}
   

   

    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={value}
      visible={dragging}
      placement="top"
      key={index}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>

    <Chart
        width={'500px'}
        height={'300px'}
        chartType="PieChart"
        loader={<div>Loading Chart</div>}
        data={[
            ['Coins', 'Amount'],
            ['Work', value],
            ['Eat', 2],
            ['Commute', 2],
            ['Watch TV', 2],
            ['Sleep', 7],
        ]}
        //data={this.state.myIdealBalance}
        options={{
            title: 'My Ideal Chart',
        }}
        rootProps={{ 'data-testid': '3' }}
        />
    </>
  );
  
  
};




// doc - https://github.com/ethereum/wiki/wiki/JavaScript-API
// token images - https://github.com/TrustWallet/tokens
// bit list of contracts - https://github.com/kvhnuke/etherwallet/blob/mercury/app/scripts/tokens/ethTokens.json
class ReadCoins extends React.Component {
  state = { mydata: [['Coins', 'Amount']], myIdealBalance: [['Coins', 'Amount'], ['ETH', 100.0],['BAT',50.0]] };
  
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
        for(var i = 0; i < tokenContractsJson.length; i++) {
            var symbol = tokenContractsJson[i].symbol;
            var symbolTokenAddress = tokenContractsJson[i].address;
            console.log(symbol + " -> "  + symbolTokenAddress);

            let tokenContract = new drizzle.web3.eth.Contract(minABI, symbolTokenAddress);
            web3Call(symbol,symbolTokenAddress,tokenContract)
        }

        function web3Call(symbol,symbolTokenAddress,tokenContract) {
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
    }

    getCoinPrices();
    getTokenBalanceWithLoop(this);
  }

  render() {
   
    // if it exists, then we display its value
    return (
        <div>
            <div>
                {/* <p>My coins: {this.state.mydata}</p>; */}
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
                <Chart
                    width={'500px'}
                    height={'300px'}
                    chartType="PieChart"
                    loader={<div>Loading Chart</div>}
                    // data={[
                    //     ['Coins', 'Amount'],
                    //     ['Work', 11],
                    //     ['Eat', 2],
                    //     ['Commute', 2],
                    //     ['Watch TV', 2],
                    //     ['Sleep', 7],
                    // ]}
                    data={this.state.myIdealBalance}
                    options={{
                        title: 'My Ideal Chart',
                    }}
                    rootProps={{ 'data-testid': '2' }}
                    />
                
            </div>
            <div style={wrapperStyle}>
                <p>ETH</p>
                <Slider balance={23432} min={0} max={100} defaultValue={3} handle={handle} />
            </div>
        </div>
    )
  }
}

export default ReadCoins;