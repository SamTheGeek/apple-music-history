import React, { Component } from 'react';
import Computation from "./Computation";
import numeral from 'numeral';


class TotalsBoxes extends Component {

    render() {

        const { totals, day, songs, artists } = this.props;

        var totalsBox = <div className="box year" key="totals">
            <div>
                <p className="lead">You've listened to</p>
                <h2>{Computation.convertTime(totals.totalTime)}</h2>
                <p className="lead">of music, or {(Math.round((totals.totalTime / 1000) / 60)).toLocaleString()} minutes.</p>
            </div>
            <div>
                <h2>{numeral(totals.totalPlays).format('0,0')}</h2>
                <p className="lead">plays</p>
            </div>
        </div>

        var highestDay = <div className="box year" key="highestDay">
            <div>
                <p className="lead">On</p>
                <h3>{day.key}</h3>
                <p className="lead">you listened to</p>
                <h3>{Computation.convertTime(day.value.time)}</h3>
                <p className="lead">of music</p>
            </div>
            <div>

            </div>
        </div>

        var totalSongs = <div className="box year" key="totalSongs">
            <div>
                <h2>{numeral(songs).format('0,0')}</h2>
                <p className="lead">songs</p>
            </div>
            <div>
                <hr className="my-2" />
                <h2>{numeral(artists).format('0,0')}</h2>
                <p className="lead">artists</p>
            </div>
            <div>
                <hr className="my-2" />
                <h2>{numeral(totals.totalLyrics).format('0,0')}</h2>
                <p className="lead">times viewed lyrics</p>
            </div>
        </div>

        var div = <div className="years">
            {totalsBox}
            {highestDay}
            {totalSongs}
        </div>



        return (div);

    }

}

export default TotalsBoxes;
