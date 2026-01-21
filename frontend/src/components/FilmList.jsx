import React from 'react';
import { FilmCard } from './FilmCard';

export function FilmList({ films, onRemoveFilm, onSave, onLoad, error }) {
    return (
        <>
            <h2>your film list</h2>
            {error && <div className="error">{error}</div>}
            <div className="film-list-actions">
                <button onClick={onSave}>Save Film List</button>
                <button onClick={onLoad}>Load Film List</button>
            </div>
            <div className="film-list-grid">
                {films.map((item) => (
                    <FilmCard key={item.id} film={item} onRemove={onRemoveFilm} />
                ))}
            </div>
        </>
    );
}
