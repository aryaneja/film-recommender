import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import './App.css';

const App = () => {
    const auth = useAuth();
    const [film, setFilm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [userFilmList, setUserFilmList] = useState(() => {
        const storedFilms = localStorage.getItem('userFilmList');
        return storedFilms ? JSON.parse(storedFilms) : [];
    });
    const [trendingFilms, setTrendingFilms] = useState([]);
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const currentYear = new Date().getFullYear();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    
    useEffect(() => {
        localStorage.setItem('userFilmList', JSON.stringify(userFilmList));
    }, [userFilmList]);
    
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const getVoteColor = (voteAverage) => {
        if (voteAverage > 5) {
            const green = Math.round(((voteAverage - 5) / 5) * 255);
            return `rgb(${255 - green}, 255, ${255 - green})`;
        } else if (voteAverage < 5) {
            const red = Math.round(((5 - voteAverage) / 5) * 255);
            return `rgb(255, ${255 - red}, ${255 - red})`;
        } else {
            return `rgb(255, 255, 255)`;
        }
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedFilms = () => {
        if (!sortConfig.key) {
            return [...userFilmList];
        }
        return [...userFilmList].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    };
    
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (film.trim()) {
                addFilm();
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [film]);
    
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await fetch(
                    'https://api.themoviedb.org/3/genre/movie/list?language=en',
                    {
                        method: 'GET',
                        headers: {
                            accept: 'application/json',
                            Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch genres');
                }
                const data = await response.json();
                setGenres(data.genres);
            } catch (error) {
                console.error('Error fetching genres:', error);
            }
        };

        fetchGenres();
    },[]);

    const fetchTrendingFilms = async (genre, year) => {
        setLoading(true);
        try {
            let url = 'https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&language=en-US&with_original_language=en';
            if (genre) {
                url += `&with_genres=${genre}`;
            }
            if (year) {
                url += `&primary_release_year=${year}`;
            }
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch trending films');
            }
            const data = await response.json();
            setTrendingFilms(data.results.slice(0, 10));
        } catch (error) {
            console.error('Error fetching trending films:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrendingFilms(selectedGenre, selectedYear);
    }, [selectedGenre, selectedYear]);

    const addFilmToUserList = (newFilm) => {
        setUserFilmList(currentList => {
            return [...currentList, newFilm]
        });
    }
    const getFilmDetails = async (filmId) => {
        setLoading(true);
        let movieDetails;
        let director;
        let studio;
        try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${filmId}?language=en-US&append_to_response=credits`, {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                    },
                });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            movieDetails = await response.json();
            director = "Unknown";
            if (movieDetails.credits?.crew) {
                const directorCrew = movieDetails.credits.crew.find(
                    (crewMember) => crewMember.job === "Director"
                );
                director = directorCrew ? directorCrew.name : "Unknown";
            }
            studio = "Unknown";
            if (movieDetails.production_companies.length > 0) {
                studio = movieDetails.production_companies[0].name;
            }

            const newFilm = {
                id: movieDetails.id,
                title: movieDetails.title,
                release_date: movieDetails.release_date,
                popularity: movieDetails.popularity,
                vote_average: movieDetails.vote_average,
                overview: movieDetails.overview,
                poster: movieDetails.poster_path
                    ? `https://image.tmdb.org/t/p/w200${movieDetails.poster_path}`
                    : null,
                director: director,
                language: movieDetails.original_language,
                studio: studio,
            };
            addFilmToUserList(newFilm)

        } catch (e) {
            setError('Failed to fetch movie details. Please try again.');
            console.error("Error fetching movie details: ", e);
        } finally {
          setLoading(false);
        }   
     };

    const addFilm = async () => {
        if (film.trim()) {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
                        film
                    )}&include_adult=false&language=en-US&page=1&with_original_language=en`,
                    {
                        method: 'GET',
                        headers: {
                            accept: 'application/json',
                            Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                if (data.results) {
                    setSearchResults(data.results);
                } else {
                    setError('No results found for this film.');
                }
            } catch (e) {
                setError('Failed to fetch movies. Please try again.');
                console.error("Error searching movie: ", e);
            } finally {
                setLoading(false);
            }
        }
    };

    const removeFilm = (filmId) => {
        const updatedFilmList = userFilmList.filter((film) => film.id !== filmId);
        setUserFilmList(updatedFilmList);
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const signOutRedirect = () => {
        const clientId = "56bh1sv1pilqlhjqa6nsqoo7qu";
        const logoutUri = "https://d84l1y8p4kdic.cloudfront.net";
        const cognitoDomain = "https://us-east-1tte33hu8l.auth.us-east-1.amazoncognito.com";
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };

    return (
        <div className="container">
            <div className="header-container">
                <h1 className="header">Film Recommender</h1>
                <div className="header-controls">
                    <button className="theme-toggle" onClick={toggleTheme}>
                        {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </button>
                    {auth?.isAuthenticated ? (
                        <div className="user-info">
                            <span>Welcome, {auth.user?.profile?.email}</span>
                            <button className="auth-button" onClick={signOutRedirect}>Sign out</button>
                        </div>
                    ) : (
                        <button className="auth-button" onClick={() => auth?.signinRedirect()}>Sign in</button>
                    )}
                </div>
            </div>
            <h1 className="header">the film recommender tool</h1>
            <h2>search for a film</h2>
            <input className="input" placeholder="Enter a film name" value={film} onChange={(e) => setFilm(e.target.value)} />

            {film.trim() && searchResults.length > 0 &&(
                <ul className="recommendations">
                    {searchResults.map((item, index) => {
                        const releaseYear = item.release_date ? item.release_date.substring(0, 4) : "N/A";
                        return (
                            <li key={item.id} onClick={() => getFilmDetails(item.id)}>
                                {item.title} [{releaseYear}]
                            </li>
                        );
                    })}
                </ul>
            )}

            {trendingFilms.length > 0 && (
                <div className="trending-films">
                    
                    <div className="trending-films-header">
                        <h2>
                            {`or choose a trending film ${
                                selectedGenre
                                    ? `in ${genres.find((g) => g.id === selectedGenre)?.name}`
                                    : "across all genres"
                            } ${
                                selectedYear
                                    ? `released in ${selectedYear}`
                                    : "across all years"
                            }`}
                        </h2>
                        <div className="filter-container">
                            <select
                                value={selectedGenre ?? ""}
                                onChange={(e) =>
                                    setSelectedGenre(
                                        e.target.value === ""
                                            ? null
                                            : parseInt(e.target.value)
                                    )
                                }
                            >
                                <option value="">All Genres</option>
                                {genres.map((genre) => (
                                    <option key={genre.id} value={genre.id}>
                                        {genre.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedYear ?? ""}
                                onChange={(e) =>
                                    setSelectedYear(
                                        e.target.value === ""
                                            ? null
                                            : parseInt(e.target.value)
                                    )
                                }
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

                    <div className="trending-films-posters">
                        {trendingFilms.map((item) => (
                            <div key={item.id} className="trending-film-item">
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                                    alt={item.title}
                                    onClick={() => getFilmDetails(item.id)}
                                />
                                <div className="trending-film-info">
                                    <span>{item.title}</span>
                                    <span>{item.release_date ? item.release_date.substring(0, 4) : 'N/A'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h2>your film list</h2>
            {error && <div className="error">{error}</div>}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('title')}>Film Title</th>
                            <th onClick={() => requestSort('release_date')}>Release Date</th>
                            <th onClick={() => requestSort('popularity')} className="popularity">Popularity</th>
                            <th onClick={() => requestSort('vote_average')}>Average Vote</th>
                            <th onClick={() => requestSort('overview')} className="description">Description</th>
                            <th onClick={() => requestSort('director')} className="director">Director</th>
                            <th onClick={() => requestSort('language')} className="language">Language</th>
                            <th onClick={() => requestSort('studio')} className="studio">Studio</th>
                            <th>Poster</th>
                            <th>Remove</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFilms().map((item, index) => (
                            <tr key={index} className="listItem">
                                <td>
                                    <a href={`https://www.themoviedb.org/movie/${item.id}`} target="_blank" rel="noopener noreferrer">{item.title}</a>
                                </td>
                                <td>{item.release_date}</td>
                                <td className="popularity">{item.popularity}</td>
                                <td style={{ backgroundColor: getVoteColor(item.vote_average), color: "black" }}>
                                    {item.vote_average}
                                </td>
                                <td className="description">{item.overview}</td>
                                <td className="director">{item.director}</td>
                                <td className="language">{item.language}</td>
                                <td className="studio">{item.studio}</td>
                                <td>
                                    {item.poster && <img src={item.poster} alt={`${item.title} poster`} />}
                                </td>
                                <td>
                                    <button
                                        onClick={() => removeFilm(item.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 0,
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="red"
                                            width="24px"
                                            height="24px"
                                        >
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default App;