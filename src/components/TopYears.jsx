import React, { useEffect, useState } from 'react';
import numeral from 'numeral';
import Computation from './Computation';
import { fetchItunesArtworkUrl } from '../lib/itunesArtwork.js';

function YearBox({ year }) {
  const [imageURL, setImageURL] = useState('');

  useEffect(() => {
    let cancelled = false;
    const top = year.value[0]?.value;
    if (!top) {
      return undefined;
    }

    fetchItunesArtworkUrl(top.name, top.artist).then((url) => {
      if (!cancelled && url) {
        setImageURL(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [year]);

  const style = imageURL
    ? {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6)), url('${imageURL}')`,
      }
    : {};

  return (
    <div className="box year" style={style}>
      <div>
        <h4>{year.key}</h4>
        <h2>{year.value[0].value.name}</h2>
        <h4>{year.value[0].value.artist}</h4>
      </div>
      <div>
        <hr className="my-2" />
        <p className="lead">{numeral(year.value[0].value.plays).format('0,0')} Plays</p>
        <p>{Computation.convertTime(year.value[0].value.time)}</p>
      </div>
    </div>
  );
}

function TopYears({ years }) {
  return (
    <div className="years">
      {years.map((year) => (
        <YearBox year={year} key={year.key} />
      ))}
    </div>
  );
}

export default TopYears;
