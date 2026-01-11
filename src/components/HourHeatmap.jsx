import React from 'react';
import Computation from './Computation';

const HourHeatmap = ({ data, xLabels, xLabelsVisibility, yLabels }) => {
    const maxValue = Math.max(
        0,
        ...data.flatMap((row) => row)
    );

    return (
        <div className="hour-heatmap">
            <div className="heatmap-header">
                <div className="heatmap-y-spacer" />
                <div className="heatmap-x-labels">
                    {xLabels.map((label, index) => (
                        <div key={label} className="heatmap-x-label">
                            {xLabelsVisibility[index] ? label : ''}
                        </div>
                    ))}
                </div>
            </div>
            <div className="heatmap-body">
                {yLabels.map((label, rowIndex) => (
                    <div className="heatmap-row" key={label}>
                        <div className="heatmap-y-label">{label}</div>
                        <div className="heatmap-cells">
                            {data[rowIndex].map((value, colIndex) => {
                                const intensity = maxValue > 0 ? value / maxValue : 0;
                                const backgroundColor = `rgba(251, 126, 42, ${0.15 + intensity * 0.85})`;
                                return (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className="heatmap-cell"
                                        style={{ backgroundColor }}
                                        title={Computation.convertTime(value)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HourHeatmap;
