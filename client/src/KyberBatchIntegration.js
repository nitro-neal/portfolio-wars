import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React from "react";
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import { Chart } from "react-google-charts";
import tokenContractsJson from "./tokens.json";
import coinPricesJson from "./coinmarketcap-2018-7-31-19.json"

const fetch = require('node-fetch');

const NETWORK_URL = "https://ropsten-api.kyber.network";
const GAS_PRICE = "medium";
// TODO: Add Ref Address
const REF_ADDRESS = "0x483C5100C3E544Aef546f72dF4022c8934a6945E";

var globalDrizzle;
var globalDrizzleState;

var symbolAddressMap = new Map();
symbolAddressMap.set("DAI", "0xaD6D458402F60fD3Bd25163575031ACDce07538D".toLowerCase());
symbolAddressMap.set("BAT", "0xDb0040451F373949A4Be60dcd7b6B8D6E42658B6".toLowerCase());


async function mainStart() {

  var rawTxOne = await main("DAI", "BAT", globalDrizzleState.accounts[0], 11);
  var rawTxTwo = await main("DAI", "BAT", globalDrizzleState.accounts[0], 13);
  

  var rawTxs = [];
  rawTxs.push(rawTxOne);
  rawTxs.push(rawTxTwo);
  myBatchSendTranscation(rawTxs);
}

async function main(sellToken, buyToken, userAddress, amountToSell) {

// bat is sell
// dai is buy..

  //Step 1: If either token is not supported, quit
  if (! await isTokenSupported(symbolAddressMap.get(sellToken)) || ! await isTokenSupported(symbolAddressMap.get(buyToken))) {
    console.log("token not supported")
    return;
  }
  
  //Step 2: Check if BAT token is enabled
  if(! await isTokenEnabledForUser(symbolAddressMap.get(sellToken), userAddress)) {
    console.log("token not enabled! Enabling..")
    await enableTokenTransfer(symbolAddressMap.get(sellToken), userAddress, GAS_PRICE);
  }

  //Step 4: Get expected ETH qty from selling 100 BAT tokens
  let sellQty = await getSellQty(symbolAddressMap.get(sellToken), amountToSell);

  //Step 5: Get approximate DAI tokens receivable, set it to be minDstQty
  let buyQty = await getApproximateBuyQty(symbolAddressMap.get(buyToken));
  let minDstQty = await getApproximateReceivableTokens(sellQty,buyQty, amountToSell);
  console.log("perform trade buyQty: " + buyQty + " and minDstQty: " + minDstQty);

  console.log("Getting raw tx");
  //Step 6: Perform the BAT -> DAI trade
  let rawTx = await executeTrade(userAddress,symbolAddressMap.get(sellToken),symbolAddressMap.get(buyToken),amountToSell,minDstQty,GAS_PRICE,REF_ADDRESS);
  console.log(rawTx);
  return rawTx;
}

async function isTokenSupported(tokenAddress) {
  let tokensBasicInfoRequest = await fetch(NETWORK_URL + '/currencies');
  let tokensBasicInfo = await tokensBasicInfoRequest.json();
    let tokenSupported = tokensBasicInfo.data.some(token => {return tokenAddress == token.id});
    if (!tokenSupported) {
        console.log('Token is not supported');
    }
    return tokenSupported;
}

async function isTokenEnabledForUser(tokenAddress,walletAddress) {
  let enabledStatusesRequest = await fetch(NETWORK_URL + '/users/' + walletAddress + '/currencies');
  let enabledStatuses = await enabledStatusesRequest.json();
  for (var i=0; i < enabledStatuses.data.length; i++) {
    var token = enabledStatuses.data[i];
    if (token.id == tokenAddress) {
      return token.enabled;
    }
  }
}

async function enableTokenTransfer(tokenAddress,walletAddress,gasPrice) {
  let enableTokenDetailsRequest = await fetch(NETWORK_URL + '/users/' + walletAddress + '/currencies/' + tokenAddress + '/enable_data?gas_price=' + gasPrice);
  let enableTokenDetails = await enableTokenDetailsRequest.json();
  let rawTx = enableTokenDetails.data;

  // This maybe needs to be different..
  await mySendTranscation(rawTx);
}

// good example - https://github.com/ethereum/web3.js/issues/1125
async function mySendTranscation(rawTx) {

    //const myAccounts = await globalDrizzle.web3.eth.getAccounts()
    //console.log("MyAccounts: " + myAccounts);
    console.log("about to sign rawTx:");
    console.log(rawTx);
    //const result = await globalDrizzle.web3.eth.signTransaction(rawTx);
    var txReceipt = await globalDrizzle.web3.eth.sendTransaction(rawTx);
    // const result = await globalDrizzle.web3.eth.accounts.signTransaction(rawTx);
    //console.log(globalDrizzle.web3.eth.accounts)
    console.log("result" + JSON.stringify(txReceipt));

}

async function myBatchSendTranscation(rawTxs) {
  console.log("about to sign BATCH rawTx:");
  console.log(rawTxs);
  
  //var batch = globalDrizzle.web3.createBatch();

  const batch = new globalDrizzle.web3.BatchRequest();
  // batch.add(web3.eth.getBalance.request('0x0000000000000000000000000000000000000000', 'latest', callback));
  // batch.add(web3.eth.contract(abi).at(address).balance.request(address, callback2));

  // const params = { to: token.address, data: contractData, from: address };
  // batch.add(web3.eth.call.request(params, callBack));

  for(var i = 0; i < rawTxs.length; i++) {
    // THIS WORKS
    batch.add(globalDrizzle.web3.eth.sendTransaction(rawTxs[i], callBack))
    // batch.add(globalDrizzle.web3.eth.call.send(rawTxs[i], callBack))
  }

  //var txReceipt = batch.execute();
  console.log("BEFORE BATCH EXECUTE");
  batch.execute().then(console.log);

  console.log("AFTER BATCH EXECUTE");
  //var txReceipt = await globalDrizzle.web3.eth.sendTransaction(rawTx);
  // const result = await globalDrizzle.web3.eth.accounts.signTransaction(rawTx);
  //console.log(globalDrizzle.web3.eth.accounts)
  //console.log("result" + JSON.stringify(txReceipt));

}

function callBack(error, hash) {
  // const totalTokens = web3.utils.toBN(result).toString();
  // const balance = web3.utils.fromWei(totalTokens, "ether");
  console.log("result", hash);
}

// async function mySendTranscation(rawTx) {
//     // console.log("about to send raw transaction")
//     // await globalDrizzle.web3.eth.sendRawTransaction(rawTx);
//     // console.log("send raw transaction")

//     // Extract raw tx details, create a new Tx
//     let tx = new Tx(rawTx);
//     console.log(rawTx);
//     // Sign the transaction
//     //tx.sign(PRIVATE_KEY);
//     console.log("about to sign with address: " + tx.hash());
//     //const serializedTx = await globalDrizzle.web3.eth.accounts.sign(USER_ADDRESS, tx.hash());
    
//     // almost works..
//     // const serializedTx = await globalDrizzle.web3.eth.accounts.sign(USER_ADDRESS, rawTx);

//     const serializedTx = await globalDrizzle.web3.eth.signTransaction(USER_ADDRESS, JSON.stringify(rawTx));

//     //globalDrizzle.web3.eth.sign(USER_ADDRESS, )
//     console.log("serializedTx" + serializedTx);
//     // Serialize the transaction (RLP Encoding)
//     //const serializedTx = tx.serialize();
//     // Broadcast the tx
//     var txReceipt = await globalDrizzle.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).catch(error => console.log(error));
//     // Log the tx receipt
//     console.log(txReceipt);

// }

// async function broadcastTx(rawTx) {
//     // Extract raw tx details, create a new Tx
//     let tx = new Tx(rawTx);
//     // Sign the transaction
//     tx.sign(PRIVATE_KEY);
//     // Serialize the transaction (RLP Encoding)
//     const serializedTx = tx.serialize();
//     // Broadcast the tx
//     var txReceipt = await globalDrizzle.web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).catch(error => console.log(error));
//     // Log the tx receipt
//     console.log(txReceipt);
// }

async function getSellQty(tokenAddress, qty) {
  let sellQtyRequest = await fetch(NETWORK_URL + '/sell_rate?id=' + tokenAddress + '&qty=' + qty);
  let sellQty = await sellQtyRequest.json();
  sellQty = sellQty.data[0].dst_qty[0];
  return sellQty;
}

async function getApproximateBuyQty(tokenAddress) {
  const QTY = 1; //Quantity used for the approximation
  let approximateBuyRateRequest = await fetch(NETWORK_URL + '/buy_rate?id=' + tokenAddress + '&qty=' + QTY);
  let approximateBuyQty = await approximateBuyRateRequest.json();
  approximateBuyQty = approximateBuyQty.data[0].src_qty[0];
  return approximateBuyQty;
}

//sellQty = output from getSellQty function
//buyQty = output from getApproximateBuyQty function
//srcQty = token qty amount to swap from (100 BAT tokens in scenario)
async function getApproximateReceivableTokens(sellQty,buyQty,srcQty) {
  let expectedAmountWithoutSlippage = buyQty / sellQty * srcQty;
  let expectedAmountWithSlippage = 0.97 * expectedAmountWithoutSlippage;
  return expectedAmountWithSlippage;
}

async function executeTrade(walletAddress,srcToken,dstToken,srcQty,minDstQty,gasPrice,refAddress) {
  let tradeDetailsRequest = await fetch(NETWORK_URL + '/trade_data?user_address=' + walletAddress + '&src_id=' + srcToken + '&dst_id=' + dstToken + '&src_qty=' + srcQty + '&min_dst_qty=' + minDstQty + '&gas_price=' + gasPrice + '&wallet_id=' + refAddress);
  let tradeDetails = await tradeDetailsRequest.json();
  let rawTx = tradeDetails.data[0];
  return rawTx;

  //await broadcastTx(rawTx);
  //await mySendTranscation(rawTx);
}

//main();

function startTrade() {
    //console.log(web3.eth.accounts)
    console.log("start trade start")
    mainStart();
    //console.log(rawTx);
    console.log("start trade end")
}

class KyberBatchIntegration extends React.Component {
    constructor(props) {
        super(props);
        this.state = {data: [10]};
    }

    componentDidMount() {
        const { drizzle, drizzleState } = this.props;
        console.log(drizzle);

        globalDrizzle = drizzle;
        globalDrizzleState = drizzleState;
    }

    render() {
        var sliderObjects = [];
        return (
            <div>
                <h1>Kyber Batch</h1>
                <button text="trade" onClick={startTrade}/>
            </div>
        )
    }
}

export default KyberBatchIntegration;