import React from 'react';
import Chart from "react-google-charts";

class ShowPieChart extends React.Component {

  colorMap = new Map();
  
  componentDidMount() {
    this.colorMap.set('BTC', 'orange');
    this.colorMap.set('WBTC', 'orange');
    this.colorMap.set('ETH', 'grey');
    this.colorMap.set('BAT', 'red');
    this.colorMap.set('DAI', 'yellow');
  }

  render() {
    console.log("PIE CHART REDRAW");
    var colors = []
    var assets = this.props.assets
    var pieChartData = 
      [
        ['Coins', 'Amount']
      ];

    var totalPortfolioPercentage = 0;
    for (var i = 0; i < assets.length; i ++) {
      totalPortfolioPercentage += assets[i].newPortfolioPercent;
    }

    if(totalPortfolioPercentage < 100) {
      pieChartData.push(['Nothing', (100 - totalPortfolioPercentage)]);
      colors.push('transparent')
    }

    for (var i = 0; i < assets.length; i ++) {
      pieChartData.push([assets[i].symbol, assets[i].newPortfolioPercent]);
      if(this.colorMap.has(assets[i].symbol)) {
        colors.push(this.colorMap.get(assets[i].symbol))
      } else {
        colors.push('green')
      }
    }

    // var slices: {
    //   0: { color: 'yellow' },
    //   1: { color: 'transparent' }
    // };
    
    
    return (
      <div>
        <Chart
          width={'500px'}
          height={'300px'}
          chartType="PieChart"
          loader={<div>Loading Chart</div>}
          data={pieChartData}
          
          options={{
              title: 'Current Portfolio',
              pieHole: 0.4,
              slices: {
                0: { color: colors[0] },
                1: { color: colors[1] },
                2: { color: colors[2] },
                3: { color: colors[3] },
                4: { color: colors[4] },
                5: { color: colors[5] },
                6: { color: colors[6] },
                7: { color: colors[7] }
              }
          }}
          rootProps={{ 'data-testid': '1' }}
          />
      </div>
    )
  }
}

export default ShowPieChart;