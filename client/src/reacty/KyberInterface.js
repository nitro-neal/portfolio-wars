const fetch = require('node-fetch');

const NETWORK_URL = "https://ropsten-api.kyber.network";
const GAS_PRICE = "medium";
// TODO: Add Ref Address
const REF_ADDRESS = "0x483C5100C3E544Aef546f72dF4022c8934a6945E";

//var globalDrizzle;
//var globalDrizzleState;

var symbolAddressMap = new Map();
symbolAddressMap.set("DAI", "0xaD6D458402F60fD3Bd25163575031ACDce07538D".toLowerCase());
symbolAddressMap.set("BAT", "0xDb0040451F373949A4Be60dcd7b6B8D6E42658B6".toLowerCase());


async function mainStart(globalDrizzleState, globalDrizzle) {

  var rawTxOne = await main("DAI", "BAT", globalDrizzleState.accounts[0], 11, globalDrizzle);
  var rawTxTwo = await main("DAI", "BAT", globalDrizzleState.accounts[0], 13, globalDrizzle);
  

  var rawTxs = [];
  rawTxs.push(rawTxOne);
  rawTxs.push(rawTxTwo);
  myBatchSendTranscation(rawTxs, globalDrizzle);
}

async function main(sellToken, buyToken, userAddress, amountToSell, globalDrizzle) {

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
    await enableTokenTransfer(symbolAddressMap.get(sellToken), userAddress, GAS_PRICE, globalDrizzle);
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

async function enableTokenTransfer(tokenAddress,walletAddress,gasPrice, globalDrizzle) {
  let enableTokenDetailsRequest = await fetch(NETWORK_URL + '/users/' + walletAddress + '/currencies/' + tokenAddress + '/enable_data?gas_price=' + gasPrice);
  let enableTokenDetails = await enableTokenDetailsRequest.json();
  let rawTx = enableTokenDetails.data;

  // This maybe needs to be different..
  await mySendTranscation(rawTx, globalDrizzle);
}

// good example - https://github.com/ethereum/web3.js/issues/1125
async function mySendTranscation(rawTx, globalDrizzle) {

    console.log("about to sign rawTx:");
    console.log(rawTx);
    var txReceipt = await globalDrizzle.web3.eth.sendTransaction(rawTx);
    console.log("result" + JSON.stringify(txReceipt));
}

async function myBatchSendTranscation(rawTxs, globalDrizzle) {
  console.log("about to sign BATCH rawTx:");
  console.log(rawTxs);

  const batch = new globalDrizzle.web3.BatchRequest();

  for(var i = 0; i < rawTxs.length; i++) {
    // THIS WORKS
    batch.add(globalDrizzle.web3.eth.sendTransaction(rawTxs[i], callBack))
  }

  console.log("BEFORE BATCH EXECUTE");
  try {
    batch.execute().then(console.log);
  } catch (e) {
      // TODO: Fix this..
    console.log("Catching error for now...")
  }

  console.log("AFTER BATCH EXECUTE");
}

function callBack(error, hash) {
  // const totalTokens = web3.utils.toBN(result).toString();
  // const balance = web3.utils.fromWei(totalTokens, "ether");
  console.log("result", hash);
}

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
}

//Other helper functions
async function getSupportedTokens() {
  let tokensBasicInfoRequest = await fetch(NETWORK_URL + '/currencies')
  let tokensBasicInfo = await tokensBasicInfoRequest.json()
  console.log(tokensBasicInfo)
  return tokensBasicInfo;
}

async function getMarketInfo() {
  let marketInfoRequest = await fetch(NETWORK_URL + '/market')
  let marketInfo = await marketInfoRequest.json()
  // console.log(marketInfo)
  return marketInfo
}

async function getPast24HoursTokenInformation() {
  let past24HoursTokenInfoRequest = await fetch(NETWORK_URL + '/change24h')
  let past24HoursTokenInfo = await past24HoursTokenInfoRequest.json()
  //  console.log(past24HoursTokenInfo)
  return past24HoursTokenInfo
}

export function getMarketInformation(info) {
  if(info == 'AVAIL_TOKENS') {
    return getSupportedTokens();
  } else if (info == 'PRICE_INFO') {
    return getPast24HoursTokenInformation();
  }
}


export function startTrade(globalDrizzleState, globalDrizzle) {
    
    console.log("start trade start")
    mainStart(globalDrizzleState, globalDrizzle);
    console.log("start trade end")
}
