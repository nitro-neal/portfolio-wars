export function computeTrades(stateAssets) {
    var trades = []
    var assets = JSON.parse(JSON.stringify(stateAssets));
    var newPortfolioPercentMap = new Map();
    
    for(var iter = 0; iter < assets.length; iter++) {
        newPortfolioPercentMap.set(assets[iter].symbol, assets[iter].newPortfolioPercentMap)
        assets[iter].usdNeeded = assets[iter].newPercentUsdValue - assets[iter].usdValue
    }
    
    for(var i = 0; i < assets.length; i++) {

        if(newPortfolioPercentMap.has(assets[i].symbol)) {
            if(newPortfolioPercentMap.get(assets[i].symbol) >= assets[i].currentPortfolioPercent) {
                continue;
            }
        }

        for(var j = 0; j < assets.length; j++) {

            if(assets[i].usdNeeded < 0 && assets[j].usdNeeded > 0 && assets[i].symbol !== assets[j].symbol) {

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
    }

    return trades;
}

export function getCoinPrices(coinPricesJson) {
    var coinPriceMap = new Map();
    for(var i = 0; i < coinPricesJson.length; i++) {
        coinPriceMap.set(coinPricesJson[i].symbol, parseFloat(coinPricesJson[i].price_usd));
    }
    return coinPriceMap
}

export function getCurrentAssets(drizzle, drizzleState, tokenPriceInfo, that) {
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
    var pricePerAsset = tokenPriceInfo['ETH_ETH'].rate_usd_now
    var ethAsset =  {"symbol" : "ETH", "tokenName" : tokenPriceInfo['ETH_ETH'].token_name, "tokenAddress" :  tokenPriceInfo['ETH_ETH'].token_address, "amount" : ethBalance, "pricePerAsset":pricePerAsset, "usdValue": pricePerAsset * ethBalance, "newPercentUsdValue": pricePerAsset * ethBalance, "currentPortfolioPercent" : -1, "newPortfolioPercent" : -1}

    that.addAsset(ethAsset);

    for (var key in tokenPriceInfo) {
        var symbol = tokenPriceInfo[key].token_symbol
        var symbolTokenAddress = tokenPriceInfo[key].token_address
        let tokenContract = new drizzle.web3.eth.Contract(minABI, symbolTokenAddress);
        web3Call(drizzle, drizzleState, symbol, symbolTokenAddress, tokenContract, tokenPriceInfo, that)
    }
}

function web3Call(drizzle, drizzleState, symbol,symbolTokenAddress,tokenContract, tokenPriceInfo, that) {
    drizzle.web3.eth.call({
        to: symbolTokenAddress,
        data: tokenContract.methods.balanceOf(drizzleState.accounts[0]).encodeABI()
    }).then(balance => {
        drizzle.web3.eth.call({
            to: symbolTokenAddress,
            data: tokenContract.methods.decimals().encodeABI()
        }).then(decimals => {
            var smallNum = drizzle.web3.utils.toBN(10).pow(drizzle.web3.utils.toBN(decimals))
            var finalTokenAmount = drizzle.web3.utils.toBN(balance).div(smallNum)
        
            if(parseFloat(finalTokenAmount.toString()) > 0.0000001) {
                console.log("Non Zero Balance")
                console.log(symbol + " -> "  + finalTokenAmount.toString());

                var assetBalance = parseFloat(finalTokenAmount.toString());
                var ppatoken = 'ETH_' + symbol;
                var pricePerAsset = tokenPriceInfo[ppatoken].rate_usd_now
                var asset =  {"symbol" : symbol, "tokenName": tokenPriceInfo[ppatoken].token_name, "tokenAddress" :  tokenPriceInfo[ppatoken].token_address, "amount" : assetBalance, "pricePerAsset":pricePerAsset, "usdValue": pricePerAsset * assetBalance, "newPercentUsdValue": pricePerAsset * assetBalance, "currentPortfolioPercent" : -1, "newPortfolioPercent" : -1}

                that.addAsset(asset);
            }
        })
    })
  }