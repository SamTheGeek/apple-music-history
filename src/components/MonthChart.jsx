
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
    Legend,
    Filler
} from 'chart.js';
import Computation from "./Computation";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

class MonthChart extends Component {

    constructor(props) {
        super(props);
        this.state = {
            months: props.months
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ months: nextProps.months});
    }


    render() {

        const rawData = Computation.convetrData(this.state.months);
        const data = {
            ...rawData,
            datasets: rawData.datasets.map((dataset) => ({
                ...dataset,
                backgroundColor: dataset.fillColor,
                borderColor: dataset.strokeColor,
                pointBackgroundColor: dataset.pointColor,
                pointBorderColor: dataset.pointStrokeColor,
                pointHoverBackgroundColor: dataset.pointHighlightFill,
                pointHoverBorderColor: dataset.pointHighlightStroke,
                fill: true
            }))
        };
        const options = {
            responsive: false,
            maintainAspectRatio: false,
            elements: {
                line: {
                    tension: 0.3
                },
                point: {
                    radius: 0
                }
            }
        };

        const linechart = <Line data={data} width="600" height="300" options={options} />


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
