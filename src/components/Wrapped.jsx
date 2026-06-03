import React from 'react';
import { formatInteger } from '../lib/formatNumbers.js';
import html2canvas from 'html2canvas';

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function Wrapped({ year }) {
  const artistCount = year.artists.length > 5 ? 5 : year.artists.length;
  const songCount = year.songs.length > 5 ? 5 : year.songs.length;
  const titleString = `My Music — ${year.year}`;

  const artistsDivs = [];
  for (let index = 0; index < artistCount; index++) {
    artistsDivs.push(
      <div className="item" key={year.artists[index].key}>
        {year.artists[index].key}
      </div>,
    );
  }

  const songDivs = [];
  for (let index = 0; index < songCount; index++) {
    songDivs.push(
      <div className="item" key={year.songs[index].key}>
        {year.songs[index].value.name}{' '}
        <span className="artist">— {year.songs[index].value.artist}</span>
      </div>,
    );
  }

  const wrappedContent = (
    <div className="wrapped" id="annualwrapped">
      <h1 className="title">{titleString}</h1>
      <div className="wrapped-content">
        <div className="left">
          <h2 className="subtitle">I listened to</h2>
          <div className="number">
            {formatInteger(Math.round(parseInt(year.totalTime, 10) / 1000 / 60))}
          </div>
          <h3 className="small">minutes of music</h3>
        </div>
        <div className="right">
          <h2 className="subtitle">Top Artists</h2>
          {artistsDivs}
          <h2 className="subtitle">Top Songs</h2>
          {songDivs}
        </div>
      </div>
      <h3 className="small link">music.samthegeek.net</h3>
    </div>
  );

  return (
    <div className="box wrapped-box">
      {wrappedContent}
      <div className="shareButton">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('annualwrapped');
            if (!el) return;
            const bg =
              typeof window !== 'undefined'
                ? window.getComputedStyle(el).backgroundColor || 'rgb(225, 29, 72)'
                : 'rgb(225, 29, 72)';
            html2canvas(el, {
              scale: 2,
              backgroundColor: bg,
              logging: false,
              useCORS: true,
            }).then((canvas) => {
              downloadDataUrl(canvas.toDataURL('image/png'), 'mymusic.png');
            });
          }}
        >
          Share &apos;My {year.year} in Music&apos;
        </button>
      </div>
    </div>
  );
}

export default Wrapped;
