// function getTokenBalanceRecursive(index, coinsWithValue, that) {
//     if(index >= tokenContractsJson.length) {

//         console.log(coinsWithValue);
//         const mydata = coinsWithValue;
//         that.setState( {mydata} )

//         return;
//     }

//     var symbol = tokenContractsJson[index].symbol;
//     var symbolTokenAddress = tokenContractsJson[index].address;
//     console.log(symbol + " -> "  + symbolTokenAddress);

//     let tokenContract = new drizzle.web3.eth.Contract(minABI, symbolTokenAddress);

//     drizzle.web3.eth.call({
//         to: symbolTokenAddress,
//         data: tokenContract.methods.balanceOf(drizzleState.accounts[0]).encodeABI()
//     }).then(balance => {
//         //console.log(drizzle.web3.utils.toBN(balance).toString())
//         drizzle.web3.eth.call({
//             to: symbolTokenAddress,
//             data: tokenContract.methods.decimals().encodeABI()
//         }).then(decimals => {
//             //console.log(drizzle.web3.utils.toBN(decimals).toString())
//             var smallNum = drizzle.web3.utils.toBN(10).pow(drizzle.web3.utils.toBN(decimals))
//             var finalTokenAmount = drizzle.web3.utils.toBN(balance).div(smallNum)

//             //const mydata = finalTokenAmount.toString();
//             //this.setState( {mydata} )
            
//             console.log(finalTokenAmount.toString());

//             if(parseFloat(finalTokenAmount.toString()) > 0.0000001) {
//                 console.log("IN BLANCE")
//                 coinsWithValue.push(symbol + " -> " + finalTokenAmount.toString());
//             }

//             var newIndex = index + 1;
//             getTokenBalanceRecursive(newIndex,coinsWithValue, that)
//         })
//     })
// }