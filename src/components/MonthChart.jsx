
import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import Computation from "./Computation";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

class MonthChart extends Component {

    constructor(props) {
        super(props);
        this._colorSchemeMql =
            typeof window !== 'undefined' && typeof window.matchMedia === 'function'
                ? window.matchMedia('(prefers-color-scheme: dark)')
                : null;
        this._onColorSchemeChange = () => this.forceUpdate();
    }

    componentDidMount() {
        this._colorSchemeMql?.addEventListener('change', this._onColorSchemeChange);
    }

    componentWillUnmount() {
        this._colorSchemeMql?.removeEventListener('change', this._onColorSchemeChange);
    }

    render() {

        var linechart = (
            <Line
                data={Computation.convertMonthChartData(this.props.months)}
                options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    elements: {
                        line: { tension: 0.3 },
                        point: { radius: 0 }
                    }
                }}
            />
        );


        return (<div className="box linechart">
            <h3>Playing Time by Month</h3>
            {linechart}
            <p>
                Orange line: hours playing // Green line: hours 'skipped'
        </p>
        </div>);

    }

}

export default MonthChart;
