import React, { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import './App.css';
import { fetchFilms } from "./apiService";
import githubMark from './assets/github-mark.png'
import popcornpalLogo from './assets/popcornpal-logo.png';

const App = () => {
    const [toast, setToast] = useState(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    };

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
    const [isLoading, setIsLoading] = useState(true);
    const [customApiFilms, setCustomApiFilms] = useState([]);
    const [customApiUsername, setCustomApiUsername] = useState("");
    const [customApiLoading, setCustomApiLoading] = useState(false);
    const [customApiError, setCustomApiError] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [lastAddedFilmId, setLastAddedFilmId] = useState(null);
    const chatWindowRef = React.useRef(null);
    ;

    useEffect(() => {
        localStorage.setItem('userFilmList', JSON.stringify(userFilmList));
    }, [userFilmList]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        setIsLoading(auth.isLoading);
    }, [auth.isLoading]);

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
    }, []);

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
            if (currentList.some(film => film.id === newFilm.id)) {
                showToast(<span style={{ color: 'red' }}>This film is already in your list.</span>);
                return currentList;
            }
            setLastAddedFilmId(newFilm.id);
            showToast(`Added "${newFilm.title}" to your list!`);
            return [...currentList, newFilm];
        });
    };

    const getFilmDetails = async (filmId) => {
        setLoading(true);
        let movieDetails;
        let director;
        let studio;
        let watchProviders = null;
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
                watchProviders: watchProviders
            };
            addFilmToUserList(newFilm);

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
        const film = userFilmList.find(f => f.id === filmId);
        const updatedFilmList = userFilmList.filter((film) => film.id !== filmId);
        setUserFilmList(updatedFilmList);
        if (film) showToast(`Removed "${film.title}" from your list.`);
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const handleFetchCustomApiFilms = async () => {
        setCustomApiLoading(true);
        setCustomApiError(null);
        try {
            const data = await fetchFilms(customApiUsername);
            if (data && data.body) {
                const parsedBody = JSON.parse(data.body);
                if (Array.isArray(parsedBody)) {
                    const updatedFilms = await Promise.all(
                        parsedBody.map(async (filmName) => {
                            try {
                                const response = await fetch(
                                    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(filmName)}&include_adult=false&language=en-US&page=1`,
                                    {
                                        method: 'GET',
                                        headers: {
                                            accept: 'application/json',
                                            Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                                        },
                                    }
                                );

                                if (!response.ok) {
                                    throw new Error(`Failed to fetch film: ${filmName}`);
                                }

                                const data = await response.json();
                                if (data.results && data.results.length > 0) {
                                    const movieDetails = data.results[0];
                                    return {
                                        title: filmName,
                                        available: true,
                                        details: {
                                            id: movieDetails.id,
                                            title: movieDetails.title,
                                            release_date: movieDetails.release_date,
                                            popularity: movieDetails.popularity,
                                            vote_average: movieDetails.vote_average,
                                            overview: movieDetails.overview,
                                            poster: movieDetails.poster_path
                                                ? `https://image.tmdb.org/t/p/w200${movieDetails.poster_path}`
                                                : null,
                                            director: "Unknown",
                                            language: movieDetails.original_language,
                                            studio: "Unknown",
                                            fromLetterboxd: "Y",
                                        },
                                    };
                                } else {
                                    return { title: filmName, available: false };
                                }
                            } catch (error) {
                                return { title: filmName, available: false };
                            }
                        })
                    );
                    setCustomApiFilms(updatedFilms);
                } else {
                    throw new Error("Unexpected API response format");
                }
            } else {
                throw new Error("Invalid API response structure");
            }
        } catch (err) {
            setCustomApiError("Failed to fetch films from custom API. Please try again.");
        } finally {
            setCustomApiLoading(false);
        }
    };

    const addFilmFromCustomApi = async (filmDetails) => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://api.themoviedb.org/3/movie/${filmDetails.id}?language=en-US&append_to_response=credits`,
                {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch additional details for film: ${filmDetails.title}`);
            }

            const data = await response.json();

            const director = data.credits?.crew?.find((crewMember) => crewMember.job === "Director")?.name || "Unknown";
            const studio = data.production_companies?.[0]?.name || "Unknown";

            const updatedFilmDetails = {
                ...filmDetails,
                director,
                studio,
            };

            addFilmToUserList(updatedFilmDetails);
        } catch (error) {
            setError("Failed to fetch additional details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const saveFilmListToDynamoDB = async () => {
        if (!auth.isAuthenticated) {
            showToast("You need to be signed in to save your film list.");
            return;
        }
        const userEmail = auth.user?.profile.email;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dynamodb`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${auth.user?.id_token}`,
                },
                body: JSON.stringify({ userId: userEmail, filmList: userFilmList }),
            });

            if (!response.ok) {
                throw new Error("Failed to save film list.");
            }

            showToast("Film list saved successfully!");
        } catch (error) {
            showToast("Failed to save film list. Please try again.");
        }
    };

    const loadFilmListFromDynamoDB = async () => {
        if (!auth.isAuthenticated) {
            showToast("You need to be signed in to load your film list.");
            return;
        }

        const userEmail = auth.user?.profile.email;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dynamodb?userId=${userEmail}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${auth.user?.id_token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to load film list.");
            }

            const data = await response.json();
            setUserFilmList(data.filmList || []);
            showToast("Film list loaded successfully!");
        } catch (error) {
            showToast("Failed to load film list. Please try again.");
        }
    };

    const fetchFilmDetails = async (filmId) => {
        try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${filmId}?language=en-US&append_to_response=credits`, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch details for film ID: ${filmId}`);
            }

            const data = await response.json();
            const director = data.credits?.crew?.find((crewMember) => crewMember.job === "Director")?.name || "Unknown";
            const studio = data.production_companies?.[0]?.name || "Unknown";

            return {
                id: data.id,
                title: data.title,
                release_date: data.release_date,
                popularity: data.popularity,
                vote_average: data.vote_average,
                overview: data.overview,
                poster: data.poster_path ? `https://image.tmdb.org/t/p/w200${data.poster_path}` : null,
                director,
                language: data.original_language,
                studio,
            };
        } catch (error) {
            return null;
        }
    };

    const handleSendMessage = async (message, isBackground = false) => {
        let msg = userMessage;
        if (typeof message === 'string') {
            msg = message;
        } else if (message !== undefined && message !== null) {
            setError('Chat input must be text. Please enter a message.');
            return;
        }
        if (typeof msg !== 'string') {
            setError('Chat input must be text. Please enter a message.');
            return;
        }
        msg = msg.trim();
        if (!msg) {
            setError('Please enter a message to send.');
            return;
        }
        setLoading(true);
        setError(null);
        if (!isBackground) {
            setChatHistory(prev => [...prev, { human: msg, assistant: '' }]);
            setUserMessage('');
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bedrock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.user?.id_token}`,
                },
                body: JSON.stringify({
                    userMessage: msg,
                    chatHistory: chatHistory,
                    filmList: userFilmList
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.error || 'Failed to send message.');
                if (!isBackground) {
                    setChatHistory(prev => prev.slice(0, -1));
                }
                return;
            }
            const data = await response.json();
            if (data && data.error) {
                setError(data.error);
                if (!isBackground) {
                    setChatHistory(prev => prev.slice(0, -1));
                }
                return;
            }
            if (!isBackground) {
                setChatResponse(data);
            }
            if (!isBackground) {
                setChatHistory(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].assistant = data;
                    return updated;
                });
            }
            if (isBackground) {
                setChatHistory((prevHistory) => {
                    const updatedHistory = [...prevHistory];
                    updatedHistory[updatedHistory.length - 1].assistant = data;
                    return updatedHistory;
                });
            }
            return data;
        } catch (error) {
            setError("Failed to send message");
            if (!isBackground) {
                setChatHistory(prev => prev.slice(0, -1));
            }
        } finally {
            setLoading(false);
        }
    };

    const RecommendationsTable = () => (
        <div className="recommendations-table">
            <h2>Recommendations</h2>
            <table>
                <thead>
                    <tr>
                        <th>Film Title</th>
                        <th>Release Date</th>
                        <th>Popularity</th>
                        <th>Average Vote</th>
                        <th>Description</th>
                        <th>Director</th>
                        <th>Language</th>
                        <th>Studio</th>
                        <th>Poster</th>
                    </tr>
                </thead>
                <tbody>
                    {recommendations.map((film, index) => (
                        <tr key={index}>
                            <td>{film.title}</td>
                            <td>{film.release_date}</td>
                            <td>{film.popularity}</td>
                            <td>{film.vote_average}</td>
                            <td>{film.overview}</td>
                            <td>{film.director}</td>
                            <td>{film.language}</td>
                            <td>{film.studio}</td>
                            <td>
                                {film.poster ? (
                                    <img src={film.poster} alt={`${film.title} poster`} />
                                ) : (
                                    <div>No Poster Available</div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const ChatGroup = () => {
        React.useEffect(() => {
            if (chatWindowRef.current) {
                chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
            }
        }, [chatHistory, loading]);
        return (
            <div className="chat-group-bubbles chat-scrollable" ref={chatWindowRef}>
                {chatHistory.map((turn, index) => {
                    const renderText = (text) =>
                        typeof text === 'string'
                            ? text.split(/\n|\\n/g).map((line, i) => (
                                <React.Fragment key={i}>
                                    {line}
                                    {i < text.split(/\n|\\n/g).length - 1 && <br />}
                                </React.Fragment>
                            ))
                            : JSON.stringify(text);
                    return (
                        <React.Fragment key={index}>
                            <div className="chat-bubble user-bubble">
                                <span className="bubble-avatar" role="img" aria-label="User">🙂</span>
                                <span className="bubble-label">You</span>
                                <span className="bubble-text">{renderText(turn.human)}</span>
                            </div>
                            <div className="chat-bubble ai-bubble">
                                <span className="bubble-avatar" role="img" aria-label="AI">🤖</span>
                                <span className="bubble-label">Claude</span>
                                <span className="bubble-text">{renderText(turn.assistant)}</span>
                            </div>
                        </React.Fragment>
                    );
                })}
                {loading && (
                    <div className="chat-bubble ai-bubble typing-indicator">
                        <span className="bubble-avatar" role="img" aria-label="AI">🤖</span>
                        <span className="bubble-label">Claude</span>
                        <span className="bubble-text">Typing...</span>
                    </div>
                )}
            </div>
        );
    };

    const FilmCard = ({ film, onRemove }) => (
        <div className="film-card">
            <div className="film-card-poster">
                {film.poster ? (
                    <img src={film.poster} alt={`${film.title} poster`} />
                ) : (
                    <div className="no-poster">No Poster Available</div>
                )}
            </div>
            <div className="film-card-content">
                <div className="film-card-title-row">
                    <a href={`https://www.themoviedb.org/movie/${film.id}`} target="_blank" rel="noopener noreferrer" className="film-card-title">{film.title}</a>
                    <button className="film-card-remove" onClick={() => onRemove(film.id)} title="Remove">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                    </button>
                </div>
                <div className="film-card-meta">
                   {film.release_date && (
                                  <span>{new Date(film.release_date).toLocaleDateString()}</span>
                            )}
                            <br></br>
                    <span className="film-card-vote" style={{ backgroundColor: getVoteColor(film.vote_average), color: 'black' }}>{film.vote_average}</span>
                </div>
                <div className="film-card-details" >
                <div className="film-card-detail-row">
                    <span><b>Director: </b></span>
                    <span>{film.director}</span>
                </div>
                 <div className="film-card-detail-row">
                    <span><b>Studio: </b></span>
                    <span>{film.studio}</span>
                </div>
            </div>
                <div className="film-card-overview">{film.overview}</div>
            
        </div></div>
    );

    useEffect(() => {
        if (lastAddedFilmId !== null) {
            const timeout = setTimeout(() => setLastAddedFilmId(null), 1200);
            return () => clearTimeout(timeout);
        }
    }, [lastAddedFilmId]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {toast && <div className="toast">{toast}</div>}
            <div className="app-wrapper">
                <header className="header-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <a href="film.aryaneja.com"><img src={popcornpalLogo} alt="PopcornPal Logo" style={{ height: '90px' }} />  </a>
                    </div>
                    <div className="tagline"><h3><b>Smart picks, Less scrolling</b></h3></div>

                    <div className="header-controls">
                        <a href="https://github.com/aryaneja/film-recommender" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none', color: 'inherit'}}>
                           <img src={githubMark} alt="Github Repo" style={{width: '60px', height: '60px'}}/>
                        </a>
                        {auth.isAuthenticated ? (
                            
                            <div className="user-info">
                                <span>Hello: {auth.user?.profile.email}</span>
                                <button className="auth-button" onClick={() => auth.removeUser()}>Sign out</button>
                            </div>
                        ) : (
                            <button className="auth-button" onClick={() => auth.signinRedirect()}>Sign in</button>
                        )}
                    </div>
                </header>
                <div className="container">
                    <div className="trending-films">
                        <div className="trending-films-header">
                            <h2>search for a film</h2>
                            <div className="filter-container">
                                <input
                                    className="input"
                                    placeholder="Enter a film name"
                                    value={film}
                                    onChange={(e) => setFilm(e.target.value)} />
                            </div>
                        </div>
                        {film.trim() && searchResults.length > 0 && (
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
                    </div>

                    {trendingFilms.length > 0 && (
                        <div className="trending-films">
                            <div className="trending-films-header">
                                <h2>
                                    {`or choose a trending film ${selectedGenre
                                        ? `in ${genres.find((g) => g.id === selectedGenre)?.name}`
                                        : "across all genres"} ${selectedYear
                                            ? `released in ${selectedYear}`
                                            : "across all years"}`}
                                </h2>
                                <div className="filter-container">
                                    <select
                                        value={selectedGenre ?? ""}
                                        onChange={(e) => setSelectedGenre(
                                            e.target.value === ""
                                                ? null
                                                : parseInt(e.target.value)
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
                                        value={selectedYear ?? ""}
                                        onChange={(e) => setSelectedYear(
                                            e.target.value === ""
                                                ? null
                                                : parseInt(e.target.value)
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

                            <div className="trending-films-posters">
                                {trendingFilms.map((item) => (
                                    <div key={item.id} className="trending-film-item">
                                        {item.poster_path ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                                                alt={item.title}
                                                onClick={() => getFilmDetails(item.id)} />
                                        ) : (
                                            <div className="no-poster" onClick={() => getFilmDetails(item.id)}>
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
                        </div>
                    )}

                    <div className="trending-films">
                        <div className="trending-films-header">
                            <h2>or fetch films from your letterboxd feed</h2>
                            <div className="filter-container">
                                <input
                                    type="text"
                                    placeholder="enter public letterboxd username"
                                    value={customApiUsername}
                                    onChange={(e) => setCustomApiUsername(e.target.value)} />
                                <button onClick={handleFetchCustomApiFilms} disabled={customApiLoading}>
                                    {customApiLoading ? "Loading..." : "Fetch Films"}
                                </button>
                                <button onClick={() => setCustomApiFilms([])} disabled={customApiLoading || customApiFilms.length === 0}>
                                    Clear
                                </button>
                            </div>
                            {customApiError && <p className="error">{customApiError}</p>}
                        </div>
                        <ul className="recommendations">
                            {customApiFilms.map((film, index) => {
                                const releaseYear = film.details?.release_date ? film.details.release_date.substring(0, 4) : "N/A";
                                return (
                                    <li key={index} onClick={() => film.available && addFilmFromCustomApi(film.details)}>
                                        {film.title} [{releaseYear}] {film.available ? "" : "Cannot Find on TMDB"}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <h2>your film list</h2>
                    {error && <div className="error">{error}</div>}
                    <div className="film-list-actions">
                        <button onClick={saveFilmListToDynamoDB}>Save Film List</button>
                        <button onClick={loadFilmListFromDynamoDB}>Load Film List</button>
                    </div>
                    <div className="film-list-grid">
                        {sortedFilms().map((item, index) => (
                            <FilmCard key={item.id} film={item} onRemove={removeFilm} />
                        ))}
                    </div>
                    {auth.isAuthenticated ? (
                        <div className="chat-container">
                            <ChatGroup />
                            <div className="chat-input">
                                <input
                                    type="text"
                                    value={userMessage}
                                    onChange={(e) => setUserMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSendMessage(userMessage);
                                    }}
                                />
                                <button onClick={() => handleSendMessage(userMessage)} disabled={loading}>Send</button>
                            </div>
                            {recommendations.length > 0 && <RecommendationsTable />}
                        </div>
                    ) : (
                        <div className="chat-container">
                            <p>Please sign in to use the AI chatbot and get personalized recommendations.</p>
                        </div>
                    )}
                </div>
                <footer className="app-footer">
                    <div className="about-section">
                        <h3>About</h3>
                        <p>
                            This project is a personal development exercise aimed at improving my React and web development skills.
                            It utilizes the TMDB API and Claude (Anthropic) for film data and AI-powered recommendations.
                        </p>
                        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
                        <p>This product uses Claude by Anthropic for AI chat and recommendations, but is not endorsed or certified by Anthropic.</p>
                    </div>
                    <div className="attribution">
                        <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
                            <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg" alt="TMDB Logo" className="tmdb-logo" />
                        </a>
                        <a href="https://www.anthropic.com/claude" target="_blank" rel="noopener noreferrer">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg" alt="Claude by Anthropic Logo" className="claude-logo" style={{ height: '32px', marginTop: '8px' }} />
                        </a>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default App;