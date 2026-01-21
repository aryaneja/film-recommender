import React from 'react';
import { useAuth } from 'react-oidc-context';
import './App.css';

import { Header } from './components/Header';
import { FilmSearch } from './components/FilmSearch';
import { TrendingFilms } from './components/TrendingFilms';
import { LetterboxdImport } from './components/LetterboxdImport';
import { FilmList } from './components/FilmList';
import { ChatWindow } from './components/ChatWindow';
import { Footer } from './components/Footer';

import { useToast } from './hooks/useToast';
import { useFilmList } from './hooks/useFilmList.jsx';
import { useChat } from './hooks/useChat';

const App = () => {
    const auth = useAuth();

    const { toast, showToast } = useToast();

    const {
        userFilmList,
        sortedFilms,
        addFilmById,
        addFilmToUserList,
        removeFilm,
        saveFilmList,
        loadFilmList,
    } = useFilmList(showToast);

    const {
        chatHistory,
        userMessage,
        setUserMessage,
        loading: chatLoading,
        error: chatError,
        chatWindowRef,
        handleSendMessage,
    } = useChat(userFilmList);

    const handleSaveFilmList = () => {
        if (!auth.isAuthenticated) {
            showToast('You need to be signed in to save your film list.');
            return;
        }
        saveFilmList(auth.user?.profile.email, auth.user?.id_token);
    };

    const handleLoadFilmList = () => {
        if (!auth.isAuthenticated) {
            showToast('You need to be signed in to load your film list.');
            return;
        }
        loadFilmList(auth.user?.profile.email, auth.user?.id_token);
    };

    const handleSendChatMessage = () => {
        handleSendMessage(userMessage, auth.user?.id_token);
    };

    if (auth.isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {toast && <div className="toast">{toast}</div>}
            <div className="app-wrapper">
                <Header auth={auth} />

                <div className="container">
                    <FilmSearch onSelectFilm={addFilmById} />

                    <TrendingFilms onSelectFilm={addFilmById} />

                    <LetterboxdImport onAddFilm={addFilmToUserList} />

                    <FilmList
                        films={sortedFilms()}
                        onRemoveFilm={removeFilm}
                        onSave={handleSaveFilmList}
                        onLoad={handleLoadFilmList}
                        error={chatError}
                    />

                    <ChatWindow
                        chatHistory={chatHistory}
                        userMessage={userMessage}
                        setUserMessage={setUserMessage}
                        onSendMessage={handleSendChatMessage}
                        loading={chatLoading}
                        chatWindowRef={chatWindowRef}
                        isAuthenticated={auth.isAuthenticated}
                    />
                </div>

                <Footer />
            </div>
        </>
    );
};

export default App;
