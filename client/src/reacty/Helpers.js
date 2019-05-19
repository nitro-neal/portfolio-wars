export function computeTrades(stateAssets) {

    console.log('compute trades start')

    var assets = JSON.parse(JSON.stringify(stateAssets));

    // var currentPortfolioPercentMap = new Map();
    var newPortfolioPercentMap = new Map();
    // var portFolioAssetsMap = new Map();

    for(var i = 0; i < assets.length; i++) {
        // portFolioAssetsMap.set(assets[i].symbol, assets[i])
        // currentPortfolioPercentMap.set(assets[i].symbol, assets[i].currentPortfolioPercent)
        newPortfolioPercentMap.set(assets[i].symbol, assets[i].newPortfolioPercentMap)
        // assets[i].usdValueOfNewPercent = getUsdValueOfNewPercent(assets[i], assets);
        console.log('precompute ' + JSON.stringify(assets[i]))
    }

    for(var i = 0; i < assets.length; i++) {
        assets[i].usdNeeded = assets[i].newPercentUsdValue - assets[i].usdValue
    }

    // for(var)
    
    var trades = []
    
    for(var i = 0; i < assets.length; i++) {

        //var bucketNumber = 0;

        if(newPortfolioPercentMap.has(assets[i].symbol)) {
            if(newPortfolioPercentMap.get(assets[i].symbol) >= assets[i].currentPortfolioPercent) {
                continue;
            }
        }

        for(var j = 0; j < assets.length; j++) {
            if(assets[i].usdNeeded < 0 && assets[j].usdNeeded > 0 && assets[i].symbol != assets[j].symbol) {
                var trade = {};
                trade.from = assets[i].symbol;
                trade.to = assets[j].symbol;
                trade.fromAddress = assets[i].tokenAddress;
                trade.toAddress = assets[j].tokenAddress;
                // we need to pour money from negative to positive
                var negativeAmountLeftToGive = assets[i].usdNeeded + assets[j].usdNeeded;

                // still more to give, other is 0
                if(negativeAmountLeftToGive <= 0) {
                    trade.usdAmount = assets[j].usdNeeded;
                    // amount in from coin..
                    trade.amount = assets[j].usdNeeded / assets[i].pricePerAsset;
                    assets[i].usdNeeded = negativeAmountLeftToGive;
                    assets[j].usdNeeded = 0;
                }

                // we gave it all
                if(negativeAmountLeftToGive > 0) {
                    trade.usdAmount = Math.abs(assets[i].usdNeeded)
                    trade.amount = Math.abs(assets[i].usdNeeded) / assets[i].pricePerAsset;
                    assets[i].usdNeeded = 0;
                    assets[j].usdNeeded = negativeAmountLeftToGive;   
                }

                trades.push(trade)
            }
        }
        // sellToPercentage(assets[i].newPortfolioPercentMap, assets[i], assets)
    }

    console.log(trades);
    return trades;
}

// function sellToPercentage(percentToSellTo, currentAsset, assets) {

//     var usdToGive = currentAsset.usdValue - currentAsset.usdValueOfNewPercent;
//     // var bucketNumber = 0;
    
//     // while(bucketNumber != assets.length - 1) {

//     //     bucketNumber ++;
//     // }

//     for(var i = 0; i < assets.length; i++) {
//         if(usdToGive <= 0 || currentAsset.symbol == assets[i].symbol) {
//             continue;
//         }
//         usdToGive -= getUsdValueOfNewPercent(assets[i], assets)
        
//     }
// }

// function getUsdValueOfNewPercent(currentAsset, assets) {
//     var totalUsdValue = 0;
//     for(var i = 0; i < assets.length; i++) {
//         totalUsdValue += assets[i].usdValue
//     }

//     console.log('TOTOAL USD VALUE' + totalUsdValue);
//     console.log('new port percent' + currentAsset.newPortfolioPercent);
//     console.log('ret?' + totalUsdValue * (currentAsset.newPortfolioPercent * .01));
//     return totalUsdValue * (currentAsset.newPortfolioPercent * .01)
// }

export function plus(a, b) {
    return a + b;
}

export function getCoinPrices(coinPricesJson) {
    var coinPriceMap = new Map();
    for(var i = 0; i < coinPricesJson.length; i++) {
        coinPriceMap.set(coinPricesJson[i].symbol, parseFloat(coinPricesJson[i].price_usd));
    }
    return coinPriceMap
}

export function getCurrentAssets(drizzle, drizzleState, tokenContractsJson, supportedTokens, tokenPriceInfo, that) {

    console.log("SYNC FUNCTION GET ASSET SUPPORTED TOKENS")
    console.log(supportedTokens)

    console.log("SYNC FUNCTION GET ASSET tokenPriceInfo")
    console.log(tokenPriceInfo)

    var token = 'ETH_' + 'BAT'
    console.log('BAT USD')
    console.log(tokenPriceInfo[token].rate_usd_now)

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

    var balance = drizzleState.accountBalances[drizzleState.accounts[0]]
    var ethBalance = parseFloat(drizzle.web3.utils.fromWei(balance, 'ether'));
    //var pricePerAsset = recentCoinPricesMap.get('ETH');
    var pricePerAsset = tokenPriceInfo['ETH_ETH'].rate_usd_now

    var ethAsset =  {"symbol" : "ETH", "tokenAddress" :  tokenPriceInfo['ETH_ETH'].token_address, "amount" : ethBalance, "pricePerAsset":pricePerAsset, "usdValue": pricePerAsset * ethBalance, "newPercentUsdValue": pricePerAsset * ethBalance, "currentPortfolioPercent" : -1, "newPortfolioPercent" : -1}

    that.addAsset(ethAsset);

    for(var i = 0; i < tokenContractsJson.length; i++) {
        var symbol = tokenContractsJson[i].symbol;
        var symbolTokenAddress = tokenContractsJson[i].address;
        let tokenContract = new drizzle.web3.eth.Contract(minABI, symbolTokenAddress);

        web3Call(drizzle, drizzleState, symbol, symbolTokenAddress, tokenContract, tokenPriceInfo, that)
        
        // console.log(symbol + " -> "  + symbolTokenAddress);
    }
}

function web3Call(drizzle, drizzleState, symbol,symbolTokenAddress,tokenContract, tokenPriceInfo, that) {
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

                var assetBalance = parseFloat(finalTokenAmount.toString());
                // var pricePerAsset = recentCoinPricesMap.get(symbol);
                var ppatoken = 'ETH_' + symbol;
                var pricePerAsset = tokenPriceInfo[ppatoken].rate_usd_now
                var asset =  {"symbol" : symbol, "tokenAddress" :  tokenPriceInfo[ppatoken].token_address, "amount" : assetBalance, "pricePerAsset":pricePerAsset, "usdValue": pricePerAsset * assetBalance, "newPercentUsdValue": pricePerAsset * assetBalance, "currentPortfolioPercent" : -1, "newPortfolioPercent" : -1}

                that.addAsset(asset);
            }
        })
    })
  }