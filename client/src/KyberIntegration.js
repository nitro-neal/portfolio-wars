import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React from "react";
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import { Chart } from "react-google-charts";
import tokenContractsJson from "./tokens.json";
import coinPricesJson from "./coinmarketcap-2018-7-31-19.json"


//https://codesandbox.io/s/github/0xproject/0x-codesandbox
// https://developer.kyber.network/docs/Integrations-RESTfulAPIGuide/
// https://ropsten.kyber.network/swap/eth-knc
// https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethsendtransaction


// Importing the relevant packages
//const Web3 = require("web3");
var globalDrizzle;
var globalDrizzleState;
const Tx = require("ethereumjs-tx");
const fetch = require('node-fetch');

// Connecting to ropsten infura node
const WS_PROVIDER = "wss://ropsten.infura.io/ws";
//const web3 = new Web3(new Web3.providers.WebsocketProvider(WS_PROVIDER));

//console.log(web3.currentProvider.constructor.name)


//Base URL for API queries
//Refer to API/ABI >> RESTFul API Overview >> Network URL section
const NETWORK_URL = "https://ropsten-api.kyber.network";

//User Details
//web3.eth.pri
// const PRIVATE_KEY = Buffer.from("DCD8236096A21603F36961198319D77F6C563B33AA433795A76372C23DF1776B", "hex"); // Remove the 0x prefix
// const USER_ADDRESS = web3.eth.accounts.privateKeyToAccount("0x" + PRIVATE_KEY.toString('hex')).address;

// var PRIVATE_KEY;
var USER_ADDRESS;

// Wallet Address for Fee Sharing Program
const REF_ADDRESS = "0x483C5100C3E544Aef546f72dF4022c8934a6945E";

//Contract Token Addresses
//0x0ce4C2fcB5E215F6160A9791a9b66955b6140916
const BAT_TOKEN_ADDRESS = "0xDb0040451F373949A4Be60dcd7b6B8D6E42658B6".toLowerCase(); //Ropsten BAT token address
const DAI_TOKEN_ADDRESS = "0xaD6D458402F60fD3Bd25163575031ACDce07538D".toLowerCase(); //Ropsten DAI token address

// my wallet
// const BAT_TOKEN_ADDRESS = "0x0ce4C2fcB5E215F6160A9791a9b66955b6140916".toLowerCase(); //Ropsten BAT token address
// const DAI_TOKEN_ADDRESS = "0x0ce4C2fcB5E215F6160A9791a9b66955b6140916".toLowerCase(); //Ropsten DAI token address

//Token Quantity
const BAT_QTY = 50; //100 BAT tokens to swap from

//Gas amount affecting speed of tx
const GAS_PRICE = "medium";

async function main() {
  //Step 1: If either token is not supported, quit
  if (! await isTokenSupported(BAT_TOKEN_ADDRESS) || ! await isTokenSupported(DAI_TOKEN_ADDRESS)) {
    // Quit the program
    console.log("token not supported")
    //process.exit(0);
    return;
  }

  //Step 2: Check if BAT token is enabled
  if(! await isTokenEnabledForUser(BAT_TOKEN_ADDRESS,USER_ADDRESS)) {
    //Step 3: Approve BAT token for trade
    console.log("token not enabled! Enabling..")
    await enableTokenTransfer(BAT_TOKEN_ADDRESS,USER_ADDRESS,GAS_PRICE);
    
  }

  //Step 4: Get expected ETH qty from selling 100 BAT tokens
  let sellQty = await getSellQty(BAT_TOKEN_ADDRESS,BAT_QTY);

  //Step 5: Get approximate DAI tokens receivable, set it to be minDstQty
  let buyQty = await getApproximateBuyQty(DAI_TOKEN_ADDRESS);
  let minDstQty = await getApproximateReceivableTokens(sellQty,buyQty,BAT_QTY);

  console.log("perform trade buyQty: " + buyQty + " and minDstQty: " + minDstQty);
  //Step 6: Perform the BAT -> DAI trade
  await executeTrade(USER_ADDRESS,BAT_TOKEN_ADDRESS,DAI_TOKEN_ADDRESS,BAT_QTY,minDstQty,GAS_PRICE,REF_ADDRESS);

  console.log("TRADE FINISHED");
  // Quit the program
  //process.exit(0);
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

  //await broadcastTx(rawTx);
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

  //await broadcastTx(rawTx);
  await mySendTranscation(rawTx);
}

//main();

function startTrade() {
    console.log(globalDrizzle.web3.eth.accounts)
    USER_ADDRESS = globalDrizzleState.accounts[0];
    console.log("addrss: " + USER_ADDRESS);
    //console.log(web3.eth.accounts)
    console.log("start trade start")
    main();
    console.log("start trade end")
}

class KyberIntegration extends React.Component {
    constructor(props) {
        super(props);
        this.state = {data: [10]};
    }

    componentDidMount() {
        const { drizzle, drizzleState } = this.props;
        globalDrizzle = drizzle;
        globalDrizzleState = drizzleState;
        console.log(drizzle);
    }

    render() {
        var sliderObjects = [];
        return (
            <div>
                <h1>Kyber</h1>
                <button text="trade" onClick={startTrade}/>
            </div>
        )
    }
}

export default KyberIntegration;