import React, { useState } from 'react';
import { fetchLetterboxdFilms } from '../services/backendApi';
import { searchFilmByName, getFilmDetails } from '../services/tmdbApi';

export function LetterboxdImport({ onAddFilm }) {
    const [customApiFilms, setCustomApiFilms] = useState([]);
    const [customApiUsername, setCustomApiUsername] = useState('');
    const [customApiLoading, setCustomApiLoading] = useState(false);
    const [customApiError, setCustomApiError] = useState(null);

    const handleFetchCustomApiFilms = async () => {
        setCustomApiLoading(true);
        setCustomApiError(null);
        try {
            const filmNames = await fetchLetterboxdFilms(customApiUsername);
            if (Array.isArray(filmNames)) {
                const updatedFilms = await Promise.all(
                    filmNames.map(async (filmName) => {
                        try {
                            const details = await searchFilmByName(filmName);
                            if (details) {
                                return {
                                    title: filmName,
                                    available: true,
                                    details: { ...details, fromLetterboxd: 'Y' },
                                };
                            }
                            return { title: filmName, available: false };
                        } catch {
                            return { title: filmName, available: false };
                        }
                    })
                );
                setCustomApiFilms(updatedFilms);
            } else {
                throw new Error('Unexpected API response format');
            }
        } catch (err) {
            setCustomApiError('Failed to fetch films from Letterboxd. Please try again.');
        } finally {
            setCustomApiLoading(false);
        }
    };

    const handleAddFilm = async (filmDetails) => {
        try {
            const fullDetails = await getFilmDetails(filmDetails.id);
            onAddFilm({ ...fullDetails, fromLetterboxd: 'Y' });
        } catch (error) {
            console.error('Failed to fetch additional details:', error);
        }
    };

    return (
        <div className="trending-films">
            <div className="trending-films-header">
                <h2>or fetch films from your letterboxd feed</h2>
                <div className="filter-container">
                    <input
                        type="text"
                        placeholder="enter public letterboxd username"
                        value={customApiUsername}
                        onChange={(e) => setCustomApiUsername(e.target.value)}
                    />
                    <button onClick={handleFetchCustomApiFilms} disabled={customApiLoading}>
                        {customApiLoading ? 'Loading...' : 'Fetch Films'}
                    </button>
                    <button
                        onClick={() => setCustomApiFilms([])}
                        disabled={customApiLoading || customApiFilms.length === 0}
                    >
                        Clear
                    </button>
                </div>
                {customApiError && <p className="error">{customApiError}</p>}
            </div>
            <ul className="recommendations">
                {customApiFilms.map((film, index) => {
                    const releaseYear = film.details?.release_date
                        ? film.details.release_date.substring(0, 4)
                        : 'N/A';
                    return (
                        <li
                            key={index}
                            onClick={() => film.available && handleAddFilm(film.details)}
                        >
                            {film.title} [{releaseYear}] {film.available ? '' : 'Cannot Find on TMDB'}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
