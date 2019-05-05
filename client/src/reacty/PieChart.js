import React from 'react';
import Chart from "react-google-charts";

class ShowPieChart extends React.Component {

  render() {
    
    console.log("PIE CHART REDRAW");
    var assets = this.props.assets
    var pieChartData = 
      [
        ['Coins', 'Amount']
      ];

    var totalPortfolioPercentage = 0;
    for (var i = 0; i < assets.length; i ++) {
      totalPortfolioPercentage += assets[i].currentPortfolioPercent;
    }

    if(totalPortfolioPercentage < 100) {
      pieChartData.push(['Nothing', (100 - totalPortfolioPercentage)]);
    }

    for (var i = 0; i < assets.length; i ++) {
      pieChartData.push([assets[i].symbol, assets[i].currentPortfolioPercent]);
    }
    
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
          }}
          rootProps={{ 'data-testid': '1' }}
          />
      </div>
    )
  }
}

export default ShowPieChart;