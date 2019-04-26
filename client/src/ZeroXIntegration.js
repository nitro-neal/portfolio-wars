import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React from "react";
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import { Chart } from "react-google-charts";
import tokenContractsJson from "./tokens.json";
import coinPricesJson from "./coinmarketcap-2018-7-31-19.json"

//https://codesandbox.io/s/github/0xproject/0x-codesandbox

class ZeroXIntegration extends React.Component {
    constructor(props) {
        super(props);
        this.state = {data: [10]};
    }

    componentDidMount() {
        
    }


    render() {
        var sliderObjects = [];
        return (
            <div>
                <h1>0x</h1>
            </div>
        )
    }
}

export default ZeroXIntegration;