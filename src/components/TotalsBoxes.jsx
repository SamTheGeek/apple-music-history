import React from 'react';
import Computation from './Computation';
import { formatInteger } from '../lib/formatNumbers.js';

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
          <h2>{formatInteger(totals.totalPlays)}</h2>
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
          <h2>{formatInteger(songs)}</h2>
          <p className="lead">songs</p>
        </div>
        <div>
          <hr className="my-2" />
          <h2>{formatInteger(artists)}</h2>
          <p className="lead">artists</p>
        </div>
      </div>
    </div>
  );
}

export default TotalsBoxes;
