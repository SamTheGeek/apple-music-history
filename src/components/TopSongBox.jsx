import React, { useEffect, useState } from 'react';
import Computation from './Computation';
import { fetchItunesArtworkUrl } from '../lib/itunesArtwork.js';

function TopSongBox({ song }) {
  const [imageURL, setImageURL] = useState('');

  useEffect(() => {
    let cancelled = false;
    const { name, artist } = song.value;

    fetchItunesArtworkUrl(name, artist).then((url) => {
      if (!cancelled && url) {
        setImageURL(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [song.value.name, song.value.artist, song.value]);

  const style = {
    maxWidth: 'calc(6em + 4 * 300px)',
    backgroundRepeat: 'no-repeat',
    backgroundPositionX: '100%',
    backgroundSize: 'contain',
    ...(imageURL
      ? { backgroundImage: `url('${imageURL}')` }
      : {}),
  };

  return (
    <div className="box top-song-box" style={style}>
      <h3>Your most played song on Apple Music is</h3>
      <h1 className="display-3">
        <p>{song.key}</p>
      </h1>
      <p className="lead">
        You&apos;ve played this <strong>{song.value.plays}</strong> times for a total of{' '}
        <strong>{Computation.convertTime(song.value.time)}</strong>, skipping{' '}
        {Computation.convertTime(song.value.missedTime)}
      </p>
    </div>
  );
}

export default TopSongBox;
