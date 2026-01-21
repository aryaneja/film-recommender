import React, { useState, useEffect, useCallback } from 'react';
import { getFilmDetails as fetchFilmDetails } from '../services/tmdbApi';
import { saveFilmList as saveToBackend, loadFilmList as loadFromBackend } from '../services/backendApi';

export function useFilmList(showToast) {
    const [userFilmList, setUserFilmList] = useState(() => {
        const storedFilms = localStorage.getItem('userFilmList');
        return storedFilms ? JSON.parse(storedFilms) : [];
    });
    const [lastAddedFilmId, setLastAddedFilmId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('userFilmList', JSON.stringify(userFilmList));
    }, [userFilmList]);

    useEffect(() => {
        if (lastAddedFilmId !== null) {
            const timeout = setTimeout(() => setLastAddedFilmId(null), 1200);
            return () => clearTimeout(timeout);
        }
    }, [lastAddedFilmId]);

    const addFilmToUserList = useCallback((newFilm) => {
        setUserFilmList(currentList => {
            if (currentList.some(film => film.id === newFilm.id)) {
                showToast(<span style={{ color: 'red' }}>This film is already in your list.</span>);
                return currentList;
            }
            setLastAddedFilmId(newFilm.id);
            showToast(`Added "${newFilm.title}" to your list!`);
            return [...currentList, newFilm];
        });
    }, [showToast]);

    const addFilmById = useCallback(async (filmId) => {
        setLoading(true);
        try {
            const filmDetails = await fetchFilmDetails(filmId);
            addFilmToUserList(filmDetails);
        } catch (error) {
            console.error('Error fetching movie details:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [addFilmToUserList]);

    const removeFilm = useCallback((filmId) => {
        const film = userFilmList.find(f => f.id === filmId);
        setUserFilmList(prev => prev.filter(f => f.id !== filmId));
        if (film) showToast(`Removed "${film.title}" from your list.`);
    }, [userFilmList, showToast]);

    const requestSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    }, []);

    const sortedFilms = useCallback(() => {
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
    }, [userFilmList, sortConfig]);

    const saveFilmList = useCallback(async (userId, token) => {
        try {
            await saveToBackend(userId, userFilmList, token);
            showToast('Film list saved successfully!');
        } catch (error) {
            showToast('Failed to save film list. Please try again.');
        }
    }, [userFilmList, showToast]);

    const loadFilmList = useCallback(async (userId, token) => {
        try {
            const data = await loadFromBackend(userId, token);
            setUserFilmList(data.filmList || []);
            showToast('Film list loaded successfully!');
        } catch (error) {
            showToast('Failed to load film list. Please try again.');
        }
    }, [showToast]);

    return {
        userFilmList,
        setUserFilmList,
        lastAddedFilmId,
        sortConfig,
        loading,
        addFilmToUserList,
        addFilmById,
        removeFilm,
        requestSort,
        sortedFilms,
        saveFilmList,
        loadFilmList,
    };
}
