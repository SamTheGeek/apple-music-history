import React, { useMemo, useState } from 'react';
import numeral from 'numeral';
import DataTable from 'react-data-table-component';
import { matchSorter } from 'match-sorter';

const AllSongsTable = ({ addExcluded, songs = [] }) => {
    const [nameFilter, setNameFilter] = useState('');
    const [artistFilter, setArtistFilter] = useState('');

    const filteredSongs = useMemo(() => {
        let filtered = songs;

        if (nameFilter) {
            filtered = matchSorter(filtered, nameFilter, {
                keys: [(item) => item.value.name]
            });
        }

        if (artistFilter) {
            filtered = matchSorter(filtered, artistFilter, {
                keys: [(item) => item.value.artist]
            });
        }

        return filtered;
    }, [songs, nameFilter, artistFilter]);

    const columns = useMemo(
        () => [
            {
                name: 'Name',
                selector: (row) => row.value.name,
                sortable: true,
                wrap: true
            },
            {
                name: 'Artist',
                selector: (row) => row.value.artist,
                sortable: true,
                wrap: true
            },
            {
                name: 'Plays',
                selector: (row) => row.value.plays,
                sortable: true,
                right: true
            },
            {
                name: 'Listened Time',
                selector: (row) => row.value.time,
                cell: (row) => <div>{numeral(row.value.time / 1000).format('00:00:00')}</div>,
                sortable: true,
                right: true
            },
            {
                name: 'Skipped Time',
                selector: (row) => row.value.missedTime,
                cell: (row) => <div>{numeral(row.value.missedTime / 1000).format('00:00:00')}</div>,
                sortable: true,
                right: true
            },
            {
                name: 'Exclude',
                cell: (row) => (
                    <input
                        name="isExcluded"
                        type="checkbox"
                        checked={row.value.excluded}
                        onChange={() => {
                            addExcluded(row);
                        }}
                    />
                ),
                right: true
            }
        ],
        [addExcluded]
    );

    return (
        <div className="all-songs-table">
            <div className="table-filters">
                <div className="filter-field">
                    <label htmlFor="filter-name">Filter by song</label>
                    <input
                        id="filter-name"
                        type="text"
                        value={nameFilter}
                        onChange={(event) => setNameFilter(event.target.value)}
                        placeholder="Search song name"
                    />
                </div>
                <div className="filter-field">
                    <label htmlFor="filter-artist">Filter by artist</label>
                    <input
                        id="filter-artist"
                        type="text"
                        value={artistFilter}
                        onChange={(event) => setArtistFilter(event.target.value)}
                        placeholder="Search artist"
                    />
                </div>
            </div>
            <DataTable
                columns={columns}
                data={filteredSongs}
                keyField="key"
                pagination
                paginationPerPage={100}
                highlightOnHover
                dense
            />
        </div>
    );
};

export default AllSongsTable;
