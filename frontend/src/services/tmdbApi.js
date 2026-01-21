const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const getHeaders = () => ({
    accept: 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
});

export async function searchFilms(query) {
    const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1&with_original_language=en`,
        {
            method: 'GET',
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
}

export async function getFilmDetails(filmId) {
    const response = await fetch(
        `${TMDB_BASE_URL}/movie/${filmId}?language=en-US&append_to_response=credits`,
        {
            method: 'GET',
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const director = data.credits?.crew?.find(
        (crewMember) => crewMember.job === 'Director'
    )?.name || 'Unknown';

    const studio = data.production_companies?.[0]?.name || 'Unknown';

    return {
        id: data.id,
        title: data.title,
        release_date: data.release_date,
        popularity: data.popularity,
        vote_average: data.vote_average,
        overview: data.overview,
        poster: data.poster_path
            ? `https://image.tmdb.org/t/p/w200${data.poster_path}`
            : null,
        director,
        language: data.original_language,
        studio,
    };
}

export async function fetchTrendingFilms(genre, year) {
    let url = `${TMDB_BASE_URL}/discover/movie?sort_by=popularity.desc&language=en-US&with_original_language=en`;

    if (genre) {
        url += `&with_genres=${genre}`;
    }
    if (year) {
        url += `&primary_release_year=${year}`;
    }

    console.log('Fetching trending films from:', url);

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Trending films error:', response.status, errorText);
        throw new Error(`Failed to fetch trending films: ${response.status}`);
    }

    const data = await response.json();
    return data.results.slice(0, 10);
}

export async function fetchGenres() {
    const response = await fetch(
        `${TMDB_BASE_URL}/genre/movie/list?language=en`,
        {
            method: 'GET',
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error('Failed to fetch genres');
    }

    const data = await response.json();
    return data.genres;
}

export async function searchFilmByName(filmName) {
    const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(filmName)}&include_adult=false&language=en-US&page=1`,
        {
            method: 'GET',
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch film: ${filmName}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
        const movie = data.results[0];
        return {
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            popularity: movie.popularity,
            vote_average: movie.vote_average,
            overview: movie.overview,
            poster: movie.poster_path
                ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                : null,
            director: 'Unknown',
            language: movie.original_language,
            studio: 'Unknown',
        };
    }
    return null;
}
