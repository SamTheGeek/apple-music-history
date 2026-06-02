import React from 'react';
import Computation from './Computation';
import numeral from 'numeral';

function TotalsBoxes({ totals, songs, artists, day }) {
  return (
    <div className="years">
      <div className="box year" key="totals">
        <div>
          <p className="lead">You&apos;ve listened to</p>
          <h2>{Computation.convertTime(totals.totalTime)}</h2>
          <p className="lead">
            of music, or {Math.round(totals.totalTime / 1000 / 60).toLocaleString()} minutes.
          </p>
        </div>
        <div>
          <h2>{numeral(totals.totalPlays).format('0,0')}</h2>
          <p className="lead">plays</p>
        </div>
      </div>

      <div className="box year" key="highestDay">
        <div>
          <p className="lead">On</p>
          <h3>{day.key}</h3>
          <p className="lead">you listened to</p>
          <h3>{Computation.convertTime(day.value.time)}</h3>
          <p className="lead">of music</p>
        </div>
      </div>

      <div className="box year" key="totalSongs">
        <div>
          <h2>{numeral(songs).format('0,0')}</h2>
          <p className="lead">songs</p>
        </div>
        <div>
          <hr className="my-2" />
          <h2>{numeral(artists).format('0,0')}</h2>
          <p className="lead">artists</p>
        </div>
      </div>
    </div>
  );
}

export default TotalsBoxes;
