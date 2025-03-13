import React, { useState, useEffect } from 'react';

const App = () => {
    const [film, setFilm] = useState('');
    const [filmRecommendations, setFilmRecommendations] = useState([]);
    const [films, setFilms] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

    // Function to determine color based on vote average
    const getVoteColor = (voteAverage) => {
        if (voteAverage > 5) {
            // Green intensity increases as voteAverage approaches 10
            const green = Math.round(((voteAverage - 5) / 5) * 255);
            return `rgb(${255 - green}, 255, ${255 - green})`;
        } else if (voteAverage < 5) {

            // Red intensity increases as voteAverage approaches 0
            const red = Math.round(((5 - voteAverage) / 5) * 255);
            return `rgb(255, ${255-red}, ${255-red})`;
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
            return [...films];
        }
        return [...films].sort((a, b) => {
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
        async function fetchData() {
            await addFilm();
        }
        fetchData();
        return;
    }, [film]);

    const getFilmDetails = async (filmId) => {
        setLoading(true);
        try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${filmId}?language=en-US`, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const movieDetails = await response.json();

            let director = "Unknown";
            if (movieDetails.credits?.crew) {
                const directorCrew = movieDetails.credits.crew.find(
                    (crewMember) => crewMember.job === "Director"
                );
                director = directorCrew ? directorCrew.name : "Unknown";
            }
            let studio = "Unknown";
            if(movieDetails.production_companies.length > 0){
                studio = movieDetails.production_companies[0].name;
            } 

            setFilms([
                ...films,
                {
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
                },
            ]);
        } catch (e) {
            setError('Failed to fetch movie details. Please try again.');
            console.error("Error fetching movie details: ", e);

        } finally {
            // Set filmRecommendations to empty after processing the details
            setFilmRecommendations([]);
            setLoading(false);
        }
    }

    const addFilm = async () => {
        if (film.trim()) {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
                        film
                    )}&include_adult=false&language=en-US&page=1`,
                    {
                        method: 'GET',
                        headers: {
                            accept: 'application/json',
                            Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
                        },
                    }
                );

                if(!response.ok){
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                if (data.results) {
                    setFilmRecommendations(data.results);
                } else {
                    setError('No results found for this film.');
                }

            } catch (e) {
                setError('Failed to fetch movies. Please try again.');
                console.error("Error searching movie: ", e);
            }
            finally{
                setLoading(false);
            }
        }
    };

    return (
        <div className="container">
            <h1 className="header">Film Recommendations</h1>
            <input className="input" placeholder="Enter a film name" value={film} onChange={(e) => {setFilm(e.target.value)}} />
             {filmRecommendations.length > 0 && (
                <ul className="recommendations">
                    {filmRecommendations.map((item, index) => (
                        <li key={item.id} onClick={() => {
                            getFilmDetails(item.id);                           
                        }}>
                            {item.title}
                        </li>
                    ))}
                </ul>)}
            {error && <div className="error">{error}</div>}
            <table>
                <thead>
                    <tr>
                        <th onClick={() => requestSort('title')}>Film Title</th>
                        <th onClick={() => requestSort('release_date')}>Release Date</th>
                        <th onClick={() => requestSort('popularity')}>Popularity</th>
                        <th onClick={() => requestSort('vote_average')}>Average Vote</th>
                        <th onClick={() => requestSort('overview')}>Description</th>
                        <th onClick={() => requestSort('director')}>Director</th>
                        <th onClick={() => requestSort('language')}>Language</th>
                        <th onClick={() => requestSort('studio')}>Studio</th>
                        <th>Poster </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedFilms().map((item, index) => (
                        <tr key={index} className="listItem">
                            <td>{item.title}</td>
                            <td>{item.release_date}</td>
                            <td>{item.popularity}</td>
                            <td
                                style={
                                    { backgroundColor: getVoteColor(item.vote_average), color: "black" }
                                }
                            >
                                {item.vote_average}
                            </td>
                            <td>{item.overview}</td>
                            <td>{item.director}</td>
                            <td>{item.language}</td>
                            <td>{item.studio}</td>
                            <td>
                                {item.poster && <img src={item.poster} alt={`${item.title} poster`} />}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default App;
