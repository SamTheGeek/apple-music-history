import React, { useState, useId } from 'react';
import { loadExport, filterRowsByStartDate } from '../data/loadExport.js';
import { enrichArtists } from '../data/enrichArtists.js';

function Banner({ dataResponseHandler, onError, onProgress }) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Choose your CSV or ZIP file to start');
  const [resolveArtists, setResolveArtists] = useState(true);
  const filterDateId = useId();
  const fileInputId = useId();
  const resolveArtistsId = useId();

  const handleFileChange = async (event) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    setLoading(true);
    onError?.(null);
    setStatusText('Reading export…');

    try {
      const { rows, sourcePath } = await loadExport(files, (progress) => {
        const labels = {
          reading: 'Reading file…',
          unzipping: 'Unzipping archive…',
          parsing: 'Parsing play history…',
        };
        const label = labels[progress.phase] ?? 'Loading…';
        const pct = progress.percent != null ? ` (${progress.percent}%)` : '';
        setStatusText(`${label}${pct}`);
        onProgress?.(progress);
      });

      setStatusText(`Loaded ${sourcePath}. Preparing report…`);

      const filterDate = document.getElementById(filterDateId)?.value ?? '';
      let filtered = filterRowsByStartDate(rows, filterDate);

      if (resolveArtists) {
        setStatusText('Resolving missing artists (iTunes Search)…');
        filtered = await enrichArtists(filtered, {
          maxLookups: 500,
          onProgress: ({ done, total }) => {
            if (total > 0) {
              setStatusText(`Resolving artists… ${done}/${total} unique tracks`);
            }
          },
        });
      }

      dataResponseHandler(filtered);
      setStatusText(`Loaded ${filtered.length.toLocaleString()} plays.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load export.';
      onError?.(message);
      setStatusText(message);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div>
      <section className="hero hero--intro" aria-busy={loading}>
        <h1 className="display-3">Apple Music Analyser</h1>
        <p className="lead">
          Open your <em>Apple Music Play Activity.csv</em> or the full Apple Media Services{' '}
          <strong>ZIP</strong> export below to generate your report.
        </p>
        <hr className="my-2" />
        <p>No data ever leaves your computer. Parsing and stats run entirely in your browser.</p>
        <div>
          <div className="upload-controls">
            <p>
              To limit the report (e.g. only 2024 onward), choose a start date. Leave blank to use
              all plays in the file.
            </p>
            <label htmlFor={filterDateId}>Start date (optional)</label>
            <input id={filterDateId} type="date" className="date-input" />
            <div className="resolve-artists-option">
              <input
                id={resolveArtistsId}
                type="checkbox"
                checked={resolveArtists}
                onChange={(e) => setResolveArtists(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor={resolveArtistsId}>
                Resolve missing artists via iTunes Search (network; caches results, up to 500
                most-played tracks)
              </label>
            </div>
          </div>
          <div className="file-input-wrap">
            <label htmlFor={fileInputId} className="file-label">
              {loading ? 'Loading…' : 'Choose CSV or ZIP'}
            </label>
            <input
              id={fileInputId}
              name="file"
              className="inputfile"
              type="file"
              accept=".csv,.zip"
              multiple
              disabled={loading}
              onChange={handleFileChange}
            />
          </div>
          <p className="status-text" role="status">
            {statusText}
          </p>
        </div>
      </section>

      <div className="box">
        <h3>Where is the file?</h3>
        <p>
          Request a copy at <a href="https://privacy.apple.com">privacy.apple.com</a> →{' '}
          <strong>Apple Media Services information</strong>. When ready, download all ZIP parts.
        </p>
        <pre>
          Apple_Media_Services/…/Apple Music Activity/Apple Music Play Activity.csv
        </pre>
        <p>
          You can upload the ZIP as-is (select every part if split) or just the CSV from that
          folder.
        </p>
        <a href="/step1.png">
          <img style={{ width: '300px' }} src="/step1.png" alt="Privacy portal step 1" />
        </a>
        <a href="/step2.png">
          <img style={{ width: '300px' }} src="/step2.png" alt="Privacy portal step 2" />
        </a>
        <a href="/step3.png">
          <img style={{ width: '300px' }} src="/step3.png" alt="Privacy portal step 3" />
        </a>
      </div>

      <div className="box">
        <h3>Example screenshots</h3>
        <a href="/image2.png">
          <img style={{ width: '300px' }} src="/image2.png" alt="Example report screenshot 1" />
        </a>
        <a href="/image1.png">
          <img style={{ width: '300px' }} src="/image1.png" alt="Example report screenshot 2" />
        </a>
        <a href="/image3.png">
          <img style={{ width: '300px' }} src="/image3.png" alt="Example report screenshot 3" />
        </a>
      </div>
    </div>
  );
}

export default Banner;
