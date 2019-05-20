const fetch = require('node-fetch');

const NETWORK_URL = "https://ropsten-api.kyber.network";
const GAS_PRICE = "medium";
const REF_ADDRESS = "0x16591D6eD1101dF43c46a027835C0717191Fb147";

var tradeCompleteCallback = {};

async function mainStart(globalDrizzleState, globalDrizzle, trades) {
  var rawTxs = [];

  for(var i = 0; i < trades.length; i ++) {
    console.log('Gettin tx for trade:')
    console.log(trades[i].from + ' => ' + trades[i].to + ': ' + trades[i].amount)

    var rawTx = await main(trades[i].from, trades[i].to, trades[i].fromAddress, trades[i].toAddress, globalDrizzleState.accounts[0], trades[i].amount, globalDrizzle);
    rawTxs.push(rawTx);
  }

  myBatchSendTranscation(rawTxs, globalDrizzle);
}

async function main(sellToken, buyToken, sellTokenAddress, buyTokenAddress, userAddress, amountToSell, globalDrizzle) {

  // TODO: I can remove this to save time..
  //Step 1: If either token is not supported, quit
  if (! await isTokenSupported(sellTokenAddress) || ! await isTokenSupported(buyTokenAddress)) {
    console.log("token not supported")
    return;
  }
  
  //Step 2: Check if token is enabled
  if(! await isTokenEnabledForUser(sellTokenAddress, userAddress)) {
    console.log("token not enabled! Enabling..")
    if(sellToken == 'ETH') {
      console.log('SELL TOKEN IS ETH SO SKIPPING ENABLE..')
    } else {
      await enableTokenTransfer(sellTokenAddress, userAddress, GAS_PRICE, globalDrizzle);
    }
  }

  //Step 4: Get expected ETH qty from selling 100 BAT tokens
  let sellQty = await getSellQty(sellTokenAddress, amountToSell);

  //Step 5: Get approximate DAI tokens receivable, set it to be minDstQty
  let buyQty = await getApproximateBuyQty(buyTokenAddress);
  let minDstQty = await getApproximateReceivableTokens(sellQty, buyQty, amountToSell);
  console.log("Perform trade with buyQty: " + buyQty + " and minDstQty: " + minDstQty);

  //Step 6: Perform the BAT -> DAI trade
  let rawTx = await executeTrade(userAddress,sellTokenAddress,buyTokenAddress,amountToSell,minDstQty,GAS_PRICE,REF_ADDRESS);
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

async function isTokenEnabledForUser(tokenAddress, walletAddress) {
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
  // TODO: FIX THIS!
  console.log('Enabling token.. hitting endpoint: ' + NETWORK_URL + '/users/' + walletAddress + '/currencies/' + tokenAddress + '/enable_data?gas_price=' + gasPrice)
  let enableTokenDetailsRequest = await fetch(NETWORK_URL + '/users/' + walletAddress + '/currencies/' + tokenAddress + '/enable_data?gas_price=' + gasPrice);
  let enableTokenDetails = await enableTokenDetailsRequest.json();

  if(enableTokenDetails.error) {
    console.log('Error in enabling token transfer: ')
    console.log(enableTokenDetails);
  }

  let rawTx = enableTokenDetails.data;

  await mySendTranscation(rawTx, globalDrizzle);
}

// good example - https://github.com/ethereum/web3.js/issues/1125
async function mySendTranscation(rawTx, globalDrizzle) {
    console.log("About to sign rawTx NOT BATCH:");
    console.log(rawTx);
    var txReceipt = await globalDrizzle.web3.eth.sendTransaction(rawTx);
    console.log("result" + JSON.stringify(txReceipt));
}

async function myBatchSendTranscation(rawTxs, globalDrizzle) {
  console.log("About to sign BATCH rawTx:");
  console.log(rawTxs);

  const batch = new globalDrizzle.web3.BatchRequest();

  for(var i = 0; i < rawTxs.length; i++) {
    // batch.add(globalDrizzle.web3.eth.sendTransaction(rawTxs[i], callBack).on('receipt', receipt => console.log('MY CALLBACK receipt', receipt)))
    batch.add(globalDrizzle.web3.eth.sendTransaction(rawTxs[i], callBack).on('receipt', receipt => tradeCompleteCallback(receipt)))
  }

  console.log("BEFORE BATCH EXECUTE");
  try {
    batch.execute().then(console.log);
  } catch (e) {
      // TODO: Fix this..
    console.log("Catching error for now...")
    //console.log(e)
  }

  console.log("AFTER BATCH EXECUTE");
}

function callBack(error, hash) {
  console.log("callback result", hash);

  // (async function() {
  //   var txHash = hash;
  //   console.log('waiting for transaction for hash: ' + hash);
  //   const minedTxReceipt = await awaitTransactionMined.awaitTx(globalWeb3, txHash);
  //   console.log('Transaction mined: ' + minedTxReceipt);
  // })();
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

async function getApproximateReceivableTokens(sellQty, buyQty, srcQty) {
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
  return marketInfo
}

async function getPast24HoursTokenInformation() {
  let past24HoursTokenInfoRequest = await fetch(NETWORK_URL + '/change24h')
  let past24HoursTokenInfo = await past24HoursTokenInfoRequest.json()
  return past24HoursTokenInfo
}

export function getMarketInformation(info) {
  if(info == 'AVAIL_TOKENS') {
    return getSupportedTokens();
  } else if (info == 'PRICE_INFO') {
    return getPast24HoursTokenInformation();
  }
}


export function startTrade(globalDrizzleState, globalDrizzle, tradeCallback, trades) {
  
    tradeCompleteCallback = tradeCallback;

    console.log("Start trade start")
    mainStart(globalDrizzleState, globalDrizzle, trades);
    console.log("Start trade end")
}
