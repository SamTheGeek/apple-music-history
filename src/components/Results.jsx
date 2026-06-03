import React, { Component } from 'react';
import Computation from './Computation';
import { formatInteger } from '../lib/formatNumbers.js';
import { computeTopAsync } from '../lib/computeTopAsync.js';

import CalendarHeatmap from './CalendarHeatmap';
import HourHeatmap from './HourHeatmap';

import ReasonsBox from './ReasonsBox';
import TopYears from './TopYears';
import MonthChart from './MonthChart';
import YearsTopSongs from './YearsTopSongs';
import TotalsBoxes from './TotalsBoxes';
import AllSongsTable from './AllSongsTable';
import TopSongBox from './TopSongBox';
import Wrapped from './Wrapped';
import LoadingPanel from './LoadingPanel';
import {
  buildArtistsCsv,
  buildSongsCsv,
  buildTopStatsJson,
  triggerDownload,
} from '../lib/exportTopStats.js';

class Results extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      excludedSongs: [],
      computeStatus: 'Computing your stats…',
      computeError: null,
    };
  }

  componentDidMount() {
    this.runComputation(this.state.data, this.state.excludedSongs);
  }

  async runComputation(data, excludedSongs) {
    this.setState({ computeStatus: 'Computing your stats…', computeError: null, songs: null });
    try {
      const payload =
        data && typeof data === 'object' && !Array.isArray(data) && data.playActivityRows
          ? {
              playActivityRows: data.playActivityRows,
              dailyTrackRows: data.dailyTrackRows ?? null,
            }
          : { playActivityRows: Array.isArray(data) ? data : [], dailyTrackRows: null };
      const results = await computeTopAsync(payload, excludedSongs);
      this.setState({
        songs: results.songs,
        days: results.days,
        months: results.months,
        reasons: results.reasons,
        data,
        years: results.years,
        artists: results.artists,
        totals: results.totals,
        filteredSongs: results.filteredSongs,
        excludedSongs: results.excludedSongs,
        hoursArray: results.hoursArray,
        thisYear: results.thisYear,
        computeStatus: null,
      });
    } catch (err) {
      this.setState({
        computeError: err instanceof Error ? err.message : 'Failed to compute stats.',
        computeStatus: null,
      });
    }
  }

  addExcluded(row) {
    const key = row.original.key;
    let excludedSongs = this.state.excludedSongs;
    if (excludedSongs.includes(key)) {
      excludedSongs = excludedSongs.filter((item) => item !== key);
    } else {
      excludedSongs = [...excludedSongs, key];
    }
    this.runComputation(this.state.data, excludedSongs);
  }

  clearExcluded() {
    this.runComputation(this.state.data, []);
  }

  downloadExportJson() {
    const json = JSON.stringify(
      buildTopStatsJson({
        filteredSongs: this.state.filteredSongs,
        artists: this.state.artists,
        totals: this.state.totals,
        thisYear: this.state.thisYear,
        excludedSongs: this.state.excludedSongs,
      }),
      null,
      2,
    );
    triggerDownload('apple-music-top-stats.json', json, 'application/json;charset=utf-8');
  }

  downloadSongsCsv() {
    const csv = buildSongsCsv(this.state.filteredSongs);
    triggerDownload('apple-music-top-songs.csv', csv, 'text/csv;charset=utf-8');
  }

  downloadArtistsCsv() {
    const csv = buildArtistsCsv(this.state.artists);
    triggerDownload('apple-music-top-artists.csv', csv, 'text/csv;charset=utf-8');
  }

  render() {
    if (this.state.computeError) {
      return (
        <div className="errorDiv box" role="alert">
          {this.state.computeError}
          <br />
          <br />
          <button type="button" className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    if (this.state.songs == null) {
      return <LoadingPanel as="h4" text={this.state.computeStatus} />;
    }

    if (this.state.songs.length <= 1) {
      return (
        <div className="errorDiv box" role="alert">
          There was an error processing your data. Please confirm you uploaded{' '}
          <em>
            Apple Music Play Activity.<strong>csv</strong>
          </em>{' '}
          or the Apple Media Services ZIP containing it.
          <br />
          <br />
          See{' '}
          <a href="https://github.com/SamTheGeek/apple-music-history/blob/main/docs/apple-export-format.md">
            export format docs
          </a>{' '}
          or the README for help.
          <br />
          <br />
          <button type="button" className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    const artistTotalCount = this.state.artists.length > 8 ? 8 : this.state.artists.length;
    const artistBoxes = [];
    for (let index = 0; index < artistTotalCount; index++) {
      const artist = this.state.artists[index];
      artistBoxes.push(
        <div className="box year" key={artist.key}>
          <div>
            <p style={{ marginBottom: 0 }}>Most played artist No.{index + 1}</p>
            <h1>{artist.key}</h1>
          </div>
          <div>
            <hr className="my-2" />
            <p className="lead">{formatInteger(artist.value.plays)} Plays</p>
            <p>{Computation.convertTime(artist.value.time)}</p>
          </div>
        </div>,
      );
    }

    const topSong = this.state.filteredSongs[0];
    const topSongBox = <TopSongBox song={topSong} />;

    const heatmapData = [];
    let firstDay = new Date();
    let maxValue = 0;
    let lastDate = new Date('2015-01-01T01:00:00');
    for (let index = 0; index < this.state.days.length; index++) {
      const day = this.state.days[index];
      heatmapData.push({
        date: day.key,
        count: day.value.time,
      });
      if (day.value.time > maxValue) {
        maxValue = day.value.time;
      }
      if (new Date(day.key) < firstDay) {
        firstDay = new Date(day.key);
      }
      if (new Date(day.key) > lastDate) {
        lastDate = new Date(day.key);
      }
    }

    const daysTodayCount = Math.round((lastDate - firstDay) / (1000 * 60 * 60 * 24));
    const dayswithoutmusic = daysTodayCount - this.state.days.length;

    const xLabels = [
      '12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am',
      '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm',
    ];
    const xLabelsVisibility = [
      true, false, false, true, false, false, true, false, false, true, false, false, true, false,
      false, true, false, false, true, false, false, true, false, false,
    ];
    const yLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

    return (
      <div>
        <section className="hero hero--dashboard">
          <div className="results-export-bar d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
            <p className="small text-body-secondary mb-0">
              Export computed stats (JSON or CSV). Everything stays in your browser — nothing is uploaded.
            </p>
            <div className="btn-group" role="group" aria-label="Export top stats">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => this.downloadExportJson()}>
                JSON
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => this.downloadSongsCsv()}>
                Songs CSV
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => this.downloadArtistsCsv()}>
                Artists CSV
              </button>
            </div>
          </div>
          {topSongBox}
          <TopYears years={this.state.years} />
          <TotalsBoxes
            totals={this.state.totals}
            songs={this.state.songs.length}
            artists={this.state.artists.length}
            day={this.state.days[0]}
          />
          <div className="years artists">{artistBoxes}</div>

          {this.state.thisYear.totalPlays > 1 && (
            <Wrapped year={this.state.thisYear} songs={this.state.thisYear.songs} />
          )}

          <MonthChart months={this.state.months} />

          <div className="box chart-box">
            <h3>Playing Time by Date</h3>
            <CalendarHeatmap
              startDate={firstDay}
              endDate={lastDate}
              values={heatmapData}
              showWeekdayLabels
              titleForValue={(value) => {
                if (value && value.date != null) {
                  return `${Computation.convertTime(value.count)} on ${value.date}`;
                }
                return '';
              }}
              classForValue={(value) => {
                if (!value) {
                  return 'color-empty';
                }
                const number = Math.ceil((value.count / maxValue) * 10) * 10;
                return `color-scale-${number}`;
              }}
            />
            <p>
              There were <strong>{formatInteger(dayswithoutmusic)}</strong> out of{' '}
              <strong>{formatInteger(daysTodayCount)}</strong> days you did not listen to
              music.
            </p>
          </div>

          <div className="box chart-box">
            <h3>Playing Time by Hour of Day</h3>
            <HourHeatmap
              xLabelsVisibility={xLabelsVisibility}
              xLabels={xLabels}
              yLabels={yLabels}
              data={this.state.hoursArray}
            />
          </div>

          <YearsTopSongs years={this.state.years} />
          <ReasonsBox reasons={this.state.reasons} />

          <div className="box">
            <div className="title-flex">
              <h1>All Songs</h1>
              <button
                type="button"
                className={`btn btn-outline-secondary btn-sm${this.state.excludedSongs.length > 0 ? ' active' : ''}`}
                onClick={() => this.clearExcluded()}
              >
                Clear Excluded ({this.state.excludedSongs.length})
              </button>
            </div>
            <AllSongsTable addExcluded={(row) => this.addExcluded(row)} songs={this.state.songs} />
          </div>
        </section>
      </div>
    );
  }
}

export default Results;
