import React from 'react';
import Slider from 'rc-slider';

const wrapperStyle = { width: 400, margin: 50 };

class AssetSlider extends React.Component {
    constructor(props) {
      super(props)
  
      this.state = {}
    }
    
    componentDidMount() {
    }

    render() {
        return (

            <div>
                {this.props.assets.map((asset) => {
                    var computedValue = asset.currentPortfolioPercent;                    
                    return (
                        <div key={asset.symbol} style={wrapperStyle}>
                            {asset.symbol} => {Math.round(asset.currentPortfolioPercent)}
                            <Slider min={0} max={100} defaultValue={5} value = {computedValue} onChange={(e) => this.props.changeSlider(asset,e)} onAfterChange={console.log('on after change')}/>
                        </div>
                    );
                    })}
            </div>
        );
    }
  }

  export default AssetSlider;