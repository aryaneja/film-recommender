import React from 'react';
import githubMark from '../assets/github-mark.png';
import popcornpalLogo from '../assets/popcornpal-logo.png';

export function Header({ auth }) {
    return (
        <header className="header-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <a href="film.aryaneja.com">
                    <img src={popcornpalLogo} alt="PopcornPal Logo" style={{ height: '90px' }} />
                </a>
            </div>
            <div className="tagline">
                <h3><b>Smart picks, Less scrolling</b></h3>
            </div>
            <div className="header-controls">
                <a
                    href="https://github.com/aryaneja/film-recommender"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    <img src={githubMark} alt="Github Repo" style={{ width: '60px', height: '60px' }} />
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
    );
}
