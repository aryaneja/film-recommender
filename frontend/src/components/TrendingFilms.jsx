import React, { useState, useEffect } from 'react';
import { fetchTrendingFilms, fetchGenres } from '../services/tmdbApi';

export function TrendingFilms({ onSelectFilm }) {
    const [trendingFilms, setTrendingFilms] = useState([]);
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [loading, setLoading] = useState(false);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const loadGenres = async () => {
            try {
                const genreList = await fetchGenres();
                setGenres(genreList);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };
        loadGenres();
    }, []);

    useEffect(() => {
        const loadTrendingFilms = async () => {
            setLoading(true);
            try {
                const films = await fetchTrendingFilms(selectedGenre, selectedYear);
                setTrendingFilms(films);
            } catch (error) {
                console.error('Error fetching trending films:', error);
            } finally {
                setLoading(false);
            }
        };
        loadTrendingFilms();
    }, [selectedGenre, selectedYear]);

    return (
        <div className="trending-films">
            <div className="trending-films-header">
                <h2>
                    {`or choose a trending film ${selectedGenre
                        ? `in ${genres.find((g) => g.id === selectedGenre)?.name}`
                        : 'across all genres'} ${selectedYear
                            ? `released in ${selectedYear}`
                            : 'across all years'}`}
                </h2>
                <div className="filter-container">
                    <select
                        value={selectedGenre ?? ''}
                        onChange={(e) => setSelectedGenre(
                            e.target.value === '' ? null : parseInt(e.target.value)
                        )}
                    >
                        <option value="">All Genres</option>
                        {genres.map((genre) => (
                            <option key={genre.id} value={genre.id}>
                                {genre.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedYear ?? ''}
                        onChange={(e) => setSelectedYear(
                            e.target.value === '' ? null : parseInt(e.target.value)
                        )}
                    >
                        <option value="">All Years</option>
                        {Array.from(
                            { length: currentYear - 1900 + 1 },
                            (_, i) => currentYear - i
                        ).map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {trendingFilms.length > 0 && (
                <div className="trending-films-posters">
                    {trendingFilms.map((item) => (
                        <div key={item.id} className="trending-film-item">
                            {item.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                                    alt={item.title}
                                    onClick={() => onSelectFilm(item.id)}
                                />
                            ) : (
                                <div className="no-poster" onClick={() => onSelectFilm(item.id)}>
                                    No Poster Available
                                </div>
                            )}
                            <div className="trending-film-info">
                                <span>{item.title}</span>
                                <span>{item.release_date ? item.release_date.substring(0, 4) : 'N/A'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
