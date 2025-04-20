
# Film Recommender: Your Personalized Movie Guide

Welcome to Film Recommender, a comprehensive web application designed to help you discover and manage your favorite films. This app leverages the power of AI, user authentication, and the extensive TMDB (The Movie Database) API to create a personalized movie-watching experience.

## Table of Contents

1.  [Features](#features)
2.  [Technologies Used](#technologies-used)
3.  [Getting Started](#getting-started)
    *   [Prerequisites](#prerequisites)
    *   [Installation](#installation)
    *   [Running the App](#running-the-app)
4.  [Usage](#usage)
    *   [User Authentication](#user-authentication)
    *   [Searching for Films](#searching-for-films)
    *   [Creating a Personal Film List](#creating-a-personal-film-list)
    *   [AI Chatbot Recommendations](#ai-chatbot-recommendations)
    *   [Letterboxd Integration](#letterboxd-integration)
    *   [Saving and Loading Film Lists](#saving-and-loading-film-lists)
5.  [Backend](#backend)
6.  [Deployment](#deployment)
7.  [Notes](#notes)
8.  [TMDB API](#tmdb-api)

## Features

*   **User Authentication:** Securely log in to access personalized features.
*   **Film Search:** Search for films using the extensive TMDB database.
*   **Personal Film List:** Create, manage, and curate your own list of favorite films.
*   **AI Chatbot:** Get personalized film recommendations from an AI-powered chatbot.
*   **Letterboxd Integration:** Import your film list directly from your Letterboxd account.
*   **DynamoDB Integration:** Save and load your personal film list from AWS DynamoDB.
* **Trending Films** Browse a selection of the most popular trending films.
* **Genre and Year Filters:** Refine trending film results by selecting a specific genre or year.
* **Dark and Light Mode:** Switch between dark and light themes.
* **Film Details:** Access detailed information on a film, including cast, crew, and production details.

## Frontend

The frontend is a modern React Single Page Application (SPA) built using:

*   **React:** For creating dynamic and interactive user interfaces.
*   **Vite:** For rapid development and efficient bundling.
*   **Yarn:** For package management.
* **OIDC:** For Secure user authentication.
* **Github Actions:** Automates deployment to AWS S3 bucket.

## Technologies Used

*   **Frontend:**
    *   React
    *   Vite
    *   Yarn
*   **Backend:**
    *   Python
    *   AWS Lambda
    *   AWS DynamoDB
*   **APIs:**
    *   TMDB API
    *   AWS Bedrock (for AI chatbot)
* **Authentication:**
    * OIDC

## Backend 

The backend is designed with scalability and efficiency in mind, utilizing the following components:

*   **AWS Lambda Functions:** Python-based serverless functions to handle backend logic, including:
    *   Fetching film data from DynamoDB.
    *   Parsing Letterboxd feeds.
    *   Processing AI chatbot interactions.
    * Processing user film list saving and loading.
*   **AWS DynamoDB:** A NoSQL database to store user film lists and other data.
* **AWS Bedrock:** AI chatbot is powered by AWS Bedrock.

The backend code is located in the `lambdas/` directory.

## Getting Started

### Prerequisites

*   Node.js and npm (or Yarn) installed.
*   An AWS account for DynamoDB and Lambda functions (if you intend to deploy).
*   TMDB API key.
*   AWS Bedrock Access

### Installation

1.  Clone the repository: `git clone <repository_url>`
2.  Navigate to the frontend directory: `cd frontend`
3.  Install frontend dependencies: `yarn install`
4. Install backend dependencies: `cd lambdas` then `pip install -r requirements.txt`

### Running the App

1.  Start the frontend: `cd frontend` then `yarn dev`
2.  The app will be running at `http://localhost:5173` (or a similar address).

## Usage

### User Authentication

*   Click the "Sign in" button to authenticate using a chosen provider (such as Google).
*   Once signed in, you can access your personal data and the AI chatbot.

### Searching for Films

*   Use the search bar to find films by title.
*   Click on search results to add them to your film list.
* Browse trending films, and use the genre and year filters to refine the results.

### Creating a Personal Film List

*   Add films to your list by searching for them or selecting a trending film.
*   Remove films from your list by clicking the 'X' icon.
* The film list includes details such as film title, release date, popularity, vote average, description, director, language, studio, and whether the film was imported from Letterboxd.

### AI Chatbot Recommendations

*   Once signed in, use the chat interface to interact with the AI.
*   Ask for film recommendations or ask questions about films.
*   The AI will provide personalized suggestions based on your current film list and previous interactions.

### Letterboxd Integration

*   Enter your public Letterboxd username in the designated field.
*   Click "Fetch Films" to load films from your Letterboxd feed.
* Select film titles to add them to your list.

### Saving and Loading Film Lists

*   Click "Save Film List" to store your current list in DynamoDB.
*   Click "Load Film List" to retrieve a previously saved list.

## Deployment

*   **Frontend:** Deployed to an AWS S3 bucket using GitHub Actions and OIDC. The final URL is [https://film.aryaneja.com](https://film.aryaneja.com).
*   **Backend:** Lambda functions are deployed using a separate GitHub Actions workflow.

## Notes

* Fetching and recommending films from DynamoDB
* Fetch and parse Letterboxd feeds

*   This project is a personal development exercise aimed at improving React, web development, and AWS skills.
*   This project is intended for educational and personal use.

## TMDB API

*   This app utilizes the [TMDB API](https://www.themoviedb.org/) to provide film data and recommendations.
This product uses the TMDB API but is not endorsed or certified by TMDB.