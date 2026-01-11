
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
    }


    render() {

        var linechart = (
            <Line
                data={Computation.convetrData(this.props.months)}
                width={600}
                height={300}
                options={{
                    responsive: false,
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
