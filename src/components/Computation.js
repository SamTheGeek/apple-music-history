// import {timestamp} from 'moment-timezone';

import { UNKNOWN_ARTIST } from '../data/normalizePlayRow.js';

function varExists(el) { 
    if (el !== null && typeof el !== "undefined" ) { 
      return true; 
    } else { 
      return false; 
    } 
}

class Computation {

    /**
     * Apple exports sometimes emit Track Description "N/A" → unknown artist; exclude from all stats.
     * @param {string} [songName]
     * @param {string} [artistName]
     * @returns {boolean}
     */
    static isExcludedPlaceholderListeningRow(songName, artistName) {
        var song = String(songName ?? '').trim();
        var artist = String(artistName ?? '').trim() || UNKNOWN_ARTIST;
        return song === 'N/A' && artist === UNKNOWN_ARTIST;
    }

    static monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    static getOffsetDayHour(date, offsetMinutes) {
        const offsetMilliseconds = offsetMinutes * 60 * 1000;
        const offsetDate = new Date(date.getTime() + offsetMilliseconds);

        return {
            day: offsetDate.getUTCDay(),
            hours: offsetDate.getUTCHours()
        };
    }


    static convetrData(input) {
        var data = {
            labels: [],
            datasets: [{
                    label: "Played Hours",
                    backgroundColor: "rgba(220,220,220,0.2)",
                    borderColor: "#FB7E2A",
                    pointBackgroundColor: "rgba(220,220,220,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    data: []
                },
                {
                    label: "Skipped Hours",
                    backgroundColor: "rgba(220,220,220,0.2)",
                    borderColor: "#BCD2C5",
                    pointBackgroundColor: "rgba(220,220,220,1)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    data: []
                }
            ]
        }

        for (let index = 0; index < input.length; index++) {
            const element = input[index];

            data.labels.push(element.key);
            data.datasets[0].data.push(element.value.time / 1000 / 60 / 60);
            data.datasets[1].data.push(element.value.missedTime / 1000 / 60 / 60);

        }


        return data;

    }

    static convertTime(timeinmilli) {
        var seconds = parseInt(timeinmilli = timeinmilli / 1000) % 60;
        var minutes = parseInt(timeinmilli = timeinmilli / 60) % 60;
        var hours = parseInt(timeinmilli = timeinmilli / 60) % 24;
        var days = parseInt(timeinmilli = timeinmilli / 24);

        var string = "";

        if (days > 0) {
            string = string + days + "d";
        }

        if (hours > 0) {
            string = string + " " + hours + "h";
        }

        if (minutes > 0) {
            string = string + " " + minutes + "m";
        }

        if (seconds > 0) {
            string = string + " " + seconds + "s";
        }

        return string;

    }



    static convertObjectToArray(array) {
        var result = [];
        for (var key in array) {
            if (array.hasOwnProperty(key)) {
                /* useful code here */
                result.push({
                    key: key,
                    value: array[key]
                });
            }
        }
        return result
    }

    /**
     * Stitch pause segments without requiring Artist Name to match (enrichment can change artist mid-session).
     */
    static isSamePlay(play, previousPlay) {
        if (previousPlay != null &&
            Computation.isPlay(previousPlay) && 
            Computation.isPlay(play) &&
            previousPlay["Song Name"] === play["Song Name"] &&
            previousPlay["End Position In Milliseconds"] === play["Start Position In Milliseconds"] &&
            previousPlay["End Reason Type"] === "PLAYBACK_MANUALLY_PAUSED") {
            return true;
        } else {
            return false;
        }
    }

    static isSamePlayNext(play, nextPlay) {
        if (nextPlay != null &&
            Computation.isPlay(nextPlay) && 
            Computation.isPlay(play) &&
            nextPlay["Song Name"] === play["Song Name"] &&
            play["End Position In Milliseconds"] === nextPlay["Start Position In Milliseconds"] &&
            play["End Reason Type"] === "PLAYBACK_MANUALLY_PAUSED") {
            return true;
        } else {
            return false;
        }
    }

    static isPlay(play) {
        if (varExists(play["Song Name"]) && play["Song Name"].length > 0 && Number(play["Media Duration In Milliseconds"]) > 0 && play["Item Type"] !== "ORIGINAL_CONTENT_SHOWS" && play["Media Type"] !== "VIDEO" && play["End Reason Type"] !== "FAILED_TO_LOAD") {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @param {Record<string, string>[]} data
     * @returns {Record<string, string>[]}
     */
    static sortPlayActivityByEventEnd(data) {
        if (!data || data.length === 0) {
            return data;
        }
        return [...data].sort((a, b) => {
            const ta = String(a["Event End Timestamp"] ?? "");
            const tb = String(b["Event End Timestamp"] ?? "");
            return ta.localeCompare(tb);
        });
    }

    /**
     * @param {string} [s]
     * @returns {number | null}
     */
    static yearFromDatePlayed(s) {
        if (!s || !String(s).trim()) {
            return null;
        }
        var raw = String(s).trim();
        if (/^\d{8}$/.test(raw)) {
            return Number(raw.slice(0, 4));
        }
        var t = Date.parse(raw);
        if (!Number.isNaN(t)) {
            return new Date(t).getFullYear();
        }
        if (/^\d{4}/.test(raw)) {
            return Number(raw.slice(0, 4));
        }
        return null;
    }

    /**
     * Top songs / artists / totals / yearly buckets from Play History Daily Tracks (one row ≈ one play).
     * @param {Record<string, string>[]} dailyRows
     * @param {string[]} excludedSongs
     * @param {number} today
     */
    static aggregateDailyTrackStats(dailyRows, excludedSongs, today) {
        var songs = {};
        var artists = {};
        var yearSongs = {};
        var thisYear = {
            totalPlays: 0,
            totalTime: 0,
            year: today,
            artists: {}
        };
        var totals = {
            totalPlays: 0,
            totalTime: 0,
            totalLyrics: 0
        };

        for (var i = 0; i < dailyRows.length; i++) {
            var row = dailyRows[i];
            var song = row["Song Name"] != null ? String(row["Song Name"]).trim() : "";
            var artist = row["Artist Name"] != null && String(row["Artist Name"]).trim().length > 0
                ? String(row["Artist Name"]).trim()
                : "Unknown Artist";
            var dur = Number(row["Play Duration Milliseconds"]);
            var datePlayed = row["Date Played"] != null ? String(row["Date Played"]).trim() : "";
            var playCountRaw = Number(row["Play Count"]);
            var playCount = Number.isFinite(playCountRaw) && playCountRaw >= 1 ? Math.floor(playCountRaw) : 1;

            if (!song || !Number.isFinite(dur) || dur <= 0) {
                continue;
            }

            if (Computation.isExcludedPlaceholderListeningRow(song, artist)) {
                continue;
            }

            var uniqueID = "'" + song + "' by " + artist;
            var excluded = excludedSongs.includes(uniqueID);

            if (songs[uniqueID] == null) {
                songs[uniqueID] = {
                    plays: 0,
                    time: 0,
                    name: song,
                    artist: artist,
                    missedTime: 0,
                    excluded: excluded
                };
            }

            songs[uniqueID].plays = songs[uniqueID].plays + playCount;
            songs[uniqueID].time = Number(songs[uniqueID].time) + dur;

            if (!excluded) {
                totals.totalPlays = totals.totalPlays + playCount;
                totals.totalTime = Number(totals.totalTime) + dur;

                if (artists[artist] == null) {
                    artists[artist] = {
                        plays: 0,
                        time: 0,
                        missedTime: 0
                    };
                }
                artists[artist].plays = artists[artist].plays + playCount;
                artists[artist].time = Number(artists[artist].time) + dur;

                var yearID = Computation.yearFromDatePlayed(datePlayed);
                if (yearID != null) {
                    if (yearSongs[yearID] == null) {
                        yearSongs[yearID] = {};
                    }
                    if (yearSongs[yearID][uniqueID] == null) {
                        yearSongs[yearID][uniqueID] = {
                            plays: 0,
                            time: 0,
                            name: song,
                            artist: artist,
                            missedTime: 0
                        };
                    }
                    yearSongs[yearID][uniqueID].plays = yearSongs[yearID][uniqueID].plays + playCount;
                    yearSongs[yearID][uniqueID].time = Number(yearSongs[yearID][uniqueID].time) + dur;

                    if (today === yearID) {
                        if (thisYear.artists[artist] == null) {
                            thisYear.artists[artist] = {
                                plays: 0,
                                time: 0,
                                missedTime: 0
                            };
                        }
                        thisYear.totalPlays = thisYear.totalPlays + playCount;
                        thisYear.totalTime = Number(thisYear.totalTime) + dur;
                        thisYear.artists[artist].plays = thisYear.artists[artist].plays + playCount;
                        thisYear.artists[artist].time = Number(thisYear.artists[artist].time) + dur;
                    }
                }
            }
        }

        var result = Computation.convertObjectToArray(songs);
        result = result.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var filteredSongs = [];
        for (var fi = 0; fi < result.length; fi++) {
            if (!result[fi].value.excluded) {
                filteredSongs.push(result[fi]);
            }
        }

        var yearresult = Computation.convertObjectToArray(yearSongs);
        for (var yi = 0; yi < yearresult.length; yi++) {
            yearresult[yi].value = Computation.convertObjectToArray(yearresult[yi].value);
            yearresult[yi].value = yearresult[yi].value.sort(function (a, b) {
                return b.value.time - a.value.time;
            });
        }

        var thisYearArtsistsResult = Computation.convertObjectToArray(thisYear.artists);
        thisYearArtsistsResult = thisYearArtsistsResult.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var thisYearSongs = yearSongs[today] != null ? Computation.convertObjectToArray(yearSongs[today]) : [];
        thisYearSongs = thisYearSongs.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var thisYearResult = {
            totalPlays: thisYear.totalPlays,
            totalTime: thisYear.totalTime,
            year: today,
            artists: thisYearArtsistsResult,
            songs: thisYearSongs
        };

        var artistsResults = Computation.convertObjectToArray(artists);
        artistsResults = artistsResults.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        return {
            songs: result,
            filteredSongs: filteredSongs,
            years: yearresult,
            thisYear: thisYearResult,
            artists: artistsResults,
            totals: totals
        };
    }

    /**
     * @param {Record<string, string>[]} data
     * @param {string[]} excludedSongs
     * @param {function(object): void} callback
     * @param {{ dailyTrackRows?: Record<string, string>[] | null }} [options]
     */
    static calculateTop(data, excludedSongs, callback, options) {
        options = options || {};

        data = Computation.sortPlayActivityByEventEnd(data);

        let today = new Date().getFullYear();
        if (new Date().getMonth() < 5) {
            today = today - 1
        }

        var songs = {};
        var artists = {};
        var yearSongs = {};
        var thisYear = {
            totalPlays: 0,
            totalTime: 0,
            year: today,
            artists: {}
        }
        var days = {};
        var months = {};
        var totals = {
            totalPlays: 0,
            totalTime: 0,
            totalLyrics: 0
        };
        var heatmapData = [
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ]
        ];
        var reasons = {
            "SCRUB_END": 0,
            "MANUALLY_SELECTED_PLAYBACK_OF_A_DIFF_ITEM": 0,
            "PLAYBACK_MANUALLY_PAUSED": 0,
            "FAILED_TO_LOAD": 0,
            "TRACK_SKIPPED_FORWARDS": 0,
            "SCRUB_BEGIN": 0,
            "NATURAL_END_OF_TRACK": 0,
            "TRACK_SKIPPED_BACKWARDS": 0,
            "NOT_APPLICABLE": 0,
            "PLAYBACK_STOPPED_DUE_TO_SESSION_TIMEOUT": 0,
            "TRACK_BANNED": 0,
            "QUICK_PLAY": 0,
            "": 0
        }


        // callback({
        //     songs: [],
        //     days: [],
        //     months: [],
        //     reasons: [],
        //     years: [],
        //     artists: [],
        //     totals: totals,
        //     filteredSongs: [],
        //     excludedSongs: [],
        //     hoursArray: heatmapData
        // })


        var previousPlay;

        for (let index = 0; index < data.length; index++) {
            const play = data[index];

            if (Computation.isExcludedPlaceholderListeningRow(play["Song Name"], play["Artist Name"])) {
                continue;
            }

            if (varExists(play["Song Name"]) && varExists(play["Artist Name"]) && varExists(play["Play Duration Milliseconds"]) && varExists(play["Media Duration In Milliseconds"]) && varExists(play["Event End Timestamp"]) && varExists(play["UTC Offset In Seconds"])) {
                reasons[play["End Reason Type"]] = reasons[play["End Reason Type"]] + 1;


                if (Computation.isPlay(play)) {
                    const uniqueID = "'" + play["Song Name"] + "' by " + play["Artist Name"];
                    
                    if (Number(play["Play Duration Milliseconds"]) > 8000 /*&& (play["Event Type"] === "PLAY_END" || play["Event Type"] === "")*/) {
    
                        if (songs[uniqueID] == null) {
                            songs[uniqueID] = {
                                plays: 0,
                                time: 0,
                                name: play["Song Name"],
                                artist: play["Artist Name"],
                                missedTime: 0,
                                excluded: excludedSongs.includes(uniqueID)
                            };
                        }
    
    
                        var missedMilliseconds = Number(play["Media Duration In Milliseconds"]) - Number(play["Play Duration Milliseconds"])
    
                        if (Computation.isSamePlayNext(play, data[index+1])) {
                            missedMilliseconds = 0;
                        }
    
                        if (!Computation.isSamePlay(play, previousPlay)) {
                            songs[uniqueID].plays = songs[uniqueID].plays + 1;

                        }
    
                        songs[uniqueID].time = Number(songs[uniqueID].time) + Number(play["Play Duration Milliseconds"]);
                        songs[uniqueID].missedTime = Number(songs[uniqueID].missedTime) + missedMilliseconds;
    
    
                        if (!songs[uniqueID].excluded) {
    
                            if (artists[play["Artist Name"]] == null) {
                                artists[play["Artist Name"]] = {
                                    plays: 0,
                                    time: 0,
                                    missedTime: 0
                                };
                            }
    
                            if (!Computation.isSamePlay(play, previousPlay)) {
                                totals.totalPlays = totals.totalPlays + 1;
                                artists[play["Artist Name"]].plays = artists[play["Artist Name"]].plays + 1;
                            }
    
    
                            totals.totalTime = Number(totals.totalTime) + Number(play["Play Duration Milliseconds"]);
                            artists[play["Artist Name"]].time = Number(artists[play["Artist Name"]].time) + Number(play["Play Duration Milliseconds"]);
                            artists[play["Artist Name"]].missedTime = Number(artists[play["Artist Name"]].missedTime) + missedMilliseconds;
    
    
                            var date = new Date(play["Event End Timestamp"]);
                            var dayID = date.getDate() + " " + Computation.monthNames[date.getMonth()] + ", " + date.getFullYear();
    
                            if (days[dayID] == null) {
                                days[dayID] = {
                                    plays: 0,
                                    time: 0
                                };
                            }
    
                            if (!Computation.isSamePlay(play, previousPlay)) {
                                days[dayID].plays = days[dayID].plays + 1;
                            }
                            days[dayID].time = Number(days[dayID].time) + Number(play["Play Duration Milliseconds"]);
    
                            var offset = Number(play["UTC Offset In Seconds"]) / 60;
                            var offsetParts = Computation.getOffsetDayHour(date, offset);
                            var dayint = offsetParts.day;
                            var hoursint = offsetParts.hours;
                            if (varExists(dayint) && dayint < 7 && dayint > 0 && varExists(hoursint) && varExists(heatmapData[dayint][hoursint])  && varExists(Number(heatmapData[dayint][hoursint])) && !isNaN(Number(heatmapData[dayint][hoursint])) && !isNaN(Number(play["Play Duration Milliseconds"]))) {
                                heatmapData[dayint][hoursint] = Number(heatmapData[dayint][hoursint]) + Number(play["Play Duration Milliseconds"]);
                            }
                            
    
    
    
                            var monthID = date.getFullYear() + "-" + Computation.monthNames[date.getMonth()];
    
                            if (months[monthID] == null) {
                                months[monthID] = {
                                    plays: 0,
                                    time: 0,
                                    missedTime: 0
                                };
                            }
    
                            if (!Computation.isSamePlay(play, previousPlay)) {
                                months[monthID].plays = months[monthID].plays + 1;
                            }
                            months[monthID].time = Number(months[monthID].time) + Number(play["Play Duration Milliseconds"]);
                            months[monthID].missedTime = Number(months[monthID].missedTime) + missedMilliseconds;
    
                            var yearID = date.getFullYear()
    
                            if (yearSongs[yearID] == null) {
                                yearSongs[yearID] = {};
                            }
    
                            if (yearSongs[yearID][uniqueID] == null) {
                                yearSongs[yearID][uniqueID] = {
                                    plays: 0,
                                    time: 0,
                                    name: play["Song Name"],
                                    artist: play["Artist Name"],
                                    missedTime: 0
                                };
                            }
    
                            
    
                            if (!Computation.isSamePlay(play, previousPlay)) {
                                yearSongs[yearID][uniqueID].plays = yearSongs[yearID][uniqueID].plays + 1;
                            }
                            yearSongs[yearID][uniqueID].time = Number(yearSongs[yearID][uniqueID].time) + Number(play["Play Duration Milliseconds"]);
                            yearSongs[yearID][uniqueID].missedTime = Number(yearSongs[yearID][uniqueID].missedTime) + missedMilliseconds;
    
    
                            if (today === yearID) {
                                if (thisYear.artists[play["Artist Name"]] == null) {
                                    thisYear.artists[play["Artist Name"]] = {
                                        plays: 0,
                                        time: 0,
                                        missedTime: 0
                                    };
                                }
        
                                if (!Computation.isSamePlay(play, previousPlay)) {
                                    thisYear.totalPlays = thisYear.totalPlays + 1;
                                    thisYear.artists[play["Artist Name"]].plays = thisYear.artists[play["Artist Name"]].plays + 1;
                                }
        
        
                                thisYear.totalTime = Number(thisYear.totalTime) + Number(play["Play Duration Milliseconds"]);
                                thisYear.artists[play["Artist Name"]].time = Number(thisYear.artists[play["Artist Name"]].time) + Number(play["Play Duration Milliseconds"]);
                                thisYear.artists[play["Artist Name"]].missedTime = Number(thisYear.artists[play["Artist Name"]].missedTime) + missedMilliseconds;
        
                            }
    
                        }
    
    
                    }
                }
            }

            

            // if (play["Event Type"] === "LYRIC_DISPLAY") {
            //     totals.totalLyrics = totals.totalLyrics + 1;
            // }

            previousPlay = play;


        }


        var result = Computation.convertObjectToArray(songs);
        result = result.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var filteredSongs = []
        for (let index = 0; index < result.length; index++) {
            if (!result[index].value.excluded) {
                filteredSongs.push(result[index]);
            } 
        }


        var yearresult = Computation.convertObjectToArray(yearSongs);

        for (let index = 0; index < yearresult.length; index++) {
            yearresult[index].value = Computation.convertObjectToArray(yearresult[index].value);
            yearresult[index].value = yearresult[index].value.sort(function (a, b) {
                return b.value.time - a.value.time;
            });
        }


        var thisYearArtsistsResult = Computation.convertObjectToArray(thisYear.artists);
        thisYearArtsistsResult = thisYearArtsistsResult.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var thisYearSongs = Computation.convertObjectToArray(yearSongs[today] || {});
        thisYearSongs = thisYearSongs.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var thisYearResult = {
            totalPlays: thisYear.totalPlays,
            totalTime: thisYear.totalTime,
            year: today,
            artists: thisYearArtsistsResult,
            songs: thisYearSongs
        }

        var resultDays = Computation.convertObjectToArray(days);
        resultDays = resultDays.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var resultMonths = Computation.convertObjectToArray(months);
        var artistsResults = Computation.convertObjectToArray(artists);
        artistsResults = artistsResults.sort(function (a, b) {
            return b.value.time - a.value.time;
        });

        var reasonsResults = Computation.convertObjectToArray(reasons);
        reasonsResults = reasonsResults.sort(function (a, b) {
            return b.value - a.value;
        });

        var returnVal = {
            songs: result,
            days: resultDays,
            months: resultMonths,
            reasons: reasonsResults,
            years: yearresult,
            artists: artistsResults,
            totals: totals,
            filteredSongs: filteredSongs,
            excludedSongs: excludedSongs,
            hoursArray: heatmapData,
            thisYear: thisYearResult
        }

        var dailyRows = options.dailyTrackRows;
        if (dailyRows != null && dailyRows.length > 0) {
            var dailyStats = Computation.aggregateDailyTrackStats(dailyRows, excludedSongs, today);
            returnVal.songs = dailyStats.songs;
            returnVal.filteredSongs = dailyStats.filteredSongs;
            returnVal.years = dailyStats.years;
            returnVal.thisYear = dailyStats.thisYear;
            returnVal.artists = dailyStats.artists;
            returnVal.totals = dailyStats.totals;
        }

        callback(returnVal);
        console.log(returnVal);

        // return 
    }
}

export default Computation;
