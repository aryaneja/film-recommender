import React from 'react';

export function Footer() {
    return (
        <footer className="app-footer">
            <div className="about-section">
                <h3>About</h3>
                <p>
                    This project is a personal development exercise aimed at improving my React and web development skills.
                    It utilizes the TMDB API and Claude (Anthropic) for film data and AI-powered recommendations.
                </p>
                <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
                <p>
                    This product uses Claude by Anthropic for AI chat and recommendations, but is not endorsed or certified by Anthropic.
                </p>
            </div>
            <div className="attribution">
                <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
                    <img
                        src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg"
                        alt="TMDB Logo"
                        className="tmdb-logo"
                    />
                </a>
                <a href="https://www.anthropic.com/claude" target="_blank" rel="noopener noreferrer">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg"
                        alt="Claude by Anthropic Logo"
                        className="claude-logo"
                        style={{ height: '32px', marginTop: '8px' }}
                    />
                </a>
            </div>
        </footer>
    );
}
