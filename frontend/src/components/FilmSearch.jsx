import React, { useState, useEffect } from 'react';
import { searchFilms } from '../services/tmdbApi';

export function FilmSearch({ onSelectFilm }) {
    const [film, setFilm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (film.trim()) {
                setLoading(true);
                try {
                    const results = await searchFilms(film);
                    setSearchResults(results);
                } catch (error) {
                    console.error('Error searching movie:', error);
                    setSearchResults([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [film]);

    const handleSelect = (filmId) => {
        onSelectFilm(filmId);
        setFilm('');
        setSearchResults([]);
    };

    return (
        <div className="trending-films">
            <div className="trending-films-header">
                <h2>search for a film</h2>
                <div className="filter-container">
                    <input
                        className="input"
                        placeholder="Enter a film name"
                        value={film}
                        onChange={(e) => setFilm(e.target.value)}
                    />
                </div>
            </div>
            {film.trim() && searchResults.length > 0 && (
                <ul className="recommendations">
                    {searchResults.map((item) => {
                        const releaseYear = item.release_date ? item.release_date.substring(0, 4) : 'N/A';
                        return (
                            <li key={item.id} onClick={() => handleSelect(item.id)}>
                                {item.title} [{releaseYear}]
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
