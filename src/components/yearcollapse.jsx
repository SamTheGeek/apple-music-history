import React, { Component } from 'react';
import numeral from 'numeral';
import Computation from "./Computation";


class YearCollapse extends Component {

    constructor(props) {
        super(props);
        this.state = {
            collapse: false
        };
        this.toggle = this.toggle.bind(this);
    }

    toggle() {
        this.setState({
            collapse: !this.state.collapse
        });
    }

    render() {

        var songsYearBox = [];
        for (let index = 0; index < 20; index++) {
            const element = this.props.year.value[index];

            if (typeof element == 'undefined') {
                continue;
            }
            
            var box = <div className="box reason" key={element.key}>
                <h3>{element.value.name}</h3>
                <h5>{element.value.artist}</h5>
                <p className="lead">{Computation.convertTime(element.value.time)} ({numeral(element.value.plays).format('0,0')} Plays)</p>
            </div>
            songsYearBox.push(box);

        }

        const div = <div className="box" key={this.props.year.key}>
            <div>
                <h1>
                    {this.props.year.key} Top Songs{' '}
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={this.toggle}
                    >
                        {this.state.collapse ? 'Close' : 'Open'}
                    </button>
                </h1>
            </div>
            <div className={`collapse-panel${this.state.collapse ? ' is-open' : ''}`}>
                <div className="reasons collapse-panel__content"> {songsYearBox} </div>
            </div>
        </div>

        return (div);

    }

}

export default YearCollapse;
