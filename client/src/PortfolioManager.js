import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React from "react";
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import { Chart } from "react-google-charts";
import tokenContractsJson from "./tokens.json";
import coinPricesJson from "./coinmarketcap-2018-7-31-19.json"

const wrapperStyle = { width: 400, margin: 50 };
const Handle = Slider.Handle;
var that;

function MySlider(props) {
    return (
        <div style={wrapperStyle}>
            <p>{props.sliderData.symbol} => {props.sliderData.value}%</p>
            <p>{props.value}</p>
            <Slider min={0} max={100} defaultValue={5} onChange={props.onHandle} onAfterChange={props.onAfterChange}/>
        </div>
    );
}

function MyChart(props) {
    var chartData =  [['Coins', 'Amount']];

    var nothingValue = 100;
    for(var i = 0; i < props.sliders.length; i++) { 
        nothingValue -= props.sliders[i].value;
    }

    var nothingElement = ['NOTHING', nothingValue];
    chartData.push(nothingElement);

    for(var i = 0; i < props.sliders.length; i++) {
        
        var newElement = []
        newElement.push(props.sliders[i].symbol);
        newElement.push(props.sliders[i].value);
        
        chartData.push(newElement);
    }

    return (
        <div>
            <Chart
            width={'500px'}
            height={'300px'}
            chartType="PieChart"
            loader={<div>Loading Chart</div>}
            data={chartData}
            options={{
                title: 'My Ideal Chart',
            }}
            rootProps={{ 'data-testid': '1' }}
            />
        </div>
    );
}

class PortfolioManager extends React.Component {
    constructor(props) {
        super(props);
        //this.state = {sliders: [10]};
        this.state = {
            sliderData: 
            [
                {
                    "id":1,
                    "symbol":"ETH",
                    "value":5
                }
            ], 
            sliderComponent : []
        }
    }

    handleKeyDown = e => {
        // if the enter key is pressed, set the value with the string
        if (e.keyCode === 13) {
          //this.setValue(e.target.value);

          var newElement =                
           {
            "id":this.state.sliderData.length,
            "symbol":e.target.value,
            "value":5
            };

          this.setState({ sliderData: [...this.state.sliderData, newElement] });
          
          // TODO ADD COMPONENT HERE
          //this.sliderStates.push({})
        }
      };

    // TODO: REMOVE THAT
    componentDidMount() {
        that = this;
    }

    doStateStuff = (index, value, sliderObject) => {        
        var newSliderElemnt = this.state.sliderData[index];
        newSliderElemnt.value = value;

        var overallSliderData = this.state.sliderData;
        overallSliderData[index] = newSliderElemnt;

        var overallPercentage = 0;

        for(var i = 0; i<this.state.sliderData.length; i ++) {
            overallPercentage += this.state.sliderData[i].value
        }

        if(overallPercentage <= 100) {
            this.setState({sliderData:overallSliderData})
        } else {
            //reset slider..
            //sliderObject.
            //this.setState({sliderData:overallSliderData})
        }

        // this.setState({sliderData:overallSliderData})
    }

    onAfterChange = (value, sliderObject) => {
        //TOOD: fix validation 
        console.log("ON AFTER CHANGE" + sliderObject[0]);
        console.log("ON AFTER CHANGE" +  value);
        //console.log("slider comp" + globSliders);
    }

    render() {
        var sliderObjects = [];
        return (
            <div>
                <MyChart sliders = {this.state.sliderData}/>
                
                <input type="text" onKeyDown={this.handleKeyDown} />
                {this.state.sliderData.map(function(object, i) {
                    var a = <MySlider key = {i} sliderData={object} onAfterChange={function(value){that.onAfterChange(value, sliderObjects)}} onHandle={function handleSliderChangeNew(value) {
                        console.log("Slider Change -" + value + " with index " + i);
                        that.doStateStuff(i, value);
                        console.log(this);
                    }}/>
                    sliderObjects.push(a);
                    return a;
                    
                })}
            </div>
        )
    }
}

export default PortfolioManager;