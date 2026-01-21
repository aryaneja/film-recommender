import React from 'react';

const getVoteColor = (voteAverage) => {
    if (voteAverage > 5) {
        const green = Math.round(((voteAverage - 5) / 5) * 255);
        return `rgb(${255 - green}, 255, ${255 - green})`;
    } else if (voteAverage < 5) {
        const red = Math.round(((5 - voteAverage) / 5) * 255);
        return `rgb(255, ${255 - red}, ${255 - red})`;
    }
    return `rgb(255, 255, 255)`;
};

export function FilmCard({ film, onRemove }) {
    return (
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
                    <a
                        href={`https://www.themoviedb.org/movie/${film.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="film-card-title"
                    >
                        {film.title}
                    </a>
                    <button
                        className="film-card-remove"
                        onClick={() => onRemove(film.id)}
                        title="Remove"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="20" height="20">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>
                <div className="film-card-meta">
                    {film.release_date && (
                        <span>{new Date(film.release_date).toLocaleDateString()}</span>
                    )}
                    <br />
                    <span
                        className="film-card-vote"
                        style={{ backgroundColor: getVoteColor(film.vote_average), color: 'black' }}
                    >
                        {film.vote_average}
                    </span>
                </div>
                <div className="film-card-details">
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
            </div>
        </div>
    );
}
