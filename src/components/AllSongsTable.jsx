import React, { useEffect, useMemo, useState } from 'react';
import numeral from 'numeral';
import { matchSorter } from 'match-sorter';

const PAGE_SIZE = 100;

const AllSongsTable = ({ addExcluded, songs = [] }) => {
    const [nameFilter, setNameFilter] = useState('');
    const [artistFilter, setArtistFilter] = useState('');
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

    useEffect(() => {
        setPage(1);
    }, [nameFilter, artistFilter]);

    const columns = useMemo(() => [
        {
            id: 'name',
            name: 'Name',
            selector: (row) => row.value.name,
            sortable: true
        },
        {
            id: 'artist',
            name: 'Artist',
            selector: (row) => row.value.artist,
            sortable: true
        },
        {
            id: 'plays',
            name: 'Plays',
            selector: (row) => row.value.plays,
            sortable: true,
            align: 'right'
        },
        {
            id: 'listenedTime',
            name: 'Listened Time',
            selector: (row) => row.value.time,
            sortable: true,
            align: 'right',
            cell: (row) => numeral(row.value.time / 1000).format('00:00:00')
        },
        {
            id: 'skippedTime',
            name: 'Skipped Time',
            selector: (row) => row.value.missedTime,
            sortable: true,
            align: 'right',
            cell: (row) => numeral(row.value.missedTime / 1000).format('00:00:00')
        },
        {
            id: 'exclude',
            name: 'Exclude',
            sortable: false,
            align: 'center',
            cell: (row) => (
                <input
                    name={`isExcluded-${row.key}`}
                    type="checkbox"
                    checked={row.value.excluded}
                    onChange={() => {
                        addExcluded(row);
                    }}
                />
            )
        }
    ], [addExcluded]);

    const sortedSongs = useMemo(() => {
        if (!sortConfig.key) {
            return filteredSongs;
        }

        const column = columns.find((item) => item.id === sortConfig.key);
        if (!column) {
            return filteredSongs;
        }

        const selector = column.selector;
        const sorted = [...filteredSongs].sort((a, b) => {
            const aValue = selector(a);
            const bValue = selector(b);
            if (aValue === bValue) {
                return 0;
            }
            if (aValue == null) {
                return 1;
            }
            if (bValue == null) {
                return -1;
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return aValue - bValue;
            }
            return String(aValue).localeCompare(String(bValue));
        });

        return sortConfig.direction === 'asc' ? sorted : sorted.reverse();
    }, [columns, filteredSongs, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(sortedSongs.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageRows = sortedSongs.slice(pageStart, pageStart + PAGE_SIZE);

    const handleSort = (columnId) => {
        setSortConfig((prev) => {
            if (prev.key === columnId) {
                return { key: columnId, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key: columnId, direction: 'asc' };
        });
    };

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
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.id}
                                    className={column.align ? `align-${column.align}` : ''}
                                >
                                    {column.sortable ? (
                                        <button
                                            type="button"
                                            className="table-sort-button"
                                            onClick={() => handleSort(column.id)}
                                        >
                                            {column.name}
                                            {sortConfig.key === column.id ? (
                                                <span className="sort-indicator">
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            ) : null}
                                        </button>
                                    ) : (
                                        column.name
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="empty-state">
                                    No songs match the current filters.
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((row) => (
                                <tr key={row.key}>
                                    {columns.map((column) => (
                                        <td
                                            key={`${row.key}-${column.id}`}
                                            className={column.align ? `align-${column.align}` : ''}
                                        >
                                            {column.cell ? column.cell(row) : column.selector(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="table-pagination">
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <div className="pagination-controls">
                    <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AllSongsTable;
