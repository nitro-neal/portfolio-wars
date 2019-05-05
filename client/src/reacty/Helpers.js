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

export function getCurrentAssets(drizzle, drizzleState, tokenContractsJson, recentCoinPricesMap, that) {

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
    console.log("DEBUG- - " + JSON.stringify(recentCoinPricesMap.get('ETH')));
    var pricePerAsset = recentCoinPricesMap.get('ETH');

    var ethAsset =  {"symbol" : "ETH", "amount" : ethBalance, "usdValue": pricePerAsset * ethBalance, "currentPortfolioPercent" : -1, "newPortfolioPercent" : -1}

    that.addAsset(ethAsset);

    for(var i = 0; i < tokenContractsJson.length; i++) {
        var symbol = tokenContractsJson[i].symbol;
        var symbolTokenAddress = tokenContractsJson[i].address;
        let tokenContract = new drizzle.web3.eth.Contract(minABI, symbolTokenAddress);

        web3Call(drizzle, drizzleState, symbol, symbolTokenAddress, tokenContract, recentCoinPricesMap, that)
        
        // console.log(symbol + " -> "  + symbolTokenAddress);
    }
}

function web3Call(drizzle, drizzleState, symbol,symbolTokenAddress,tokenContract, recentCoinPricesMap, that) {
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
                var pricePerAsset = recentCoinPricesMap.get(symbol);
                var asset =  {"symbol" : symbol, "amount" : assetBalance, "usdValue": pricePerAsset * assetBalance, "currentPortfolioPercent" : -1, "newPortfolioPercent" : -1}

                that.addAsset(asset);
            }
        })
    })
  }