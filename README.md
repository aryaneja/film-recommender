# Film Recommender

A simple film recommender web app built with React and deployed via GitHub Actions to AWS S3. Backend logic is being extended with Python-based AWS Lambda functions.

## Frontend

The frontend is a React SPA that uses Vite and Yarn. It's deployed to an AWS S3 bucket using GitHub Actions and OIDC authentication.

## Backend 
Two Python-based AWS Lambda functions will soon be added under the lambdas/ directory. These will handle backend logic such as:

* Fetching and recommending films from DynamoDB
* Fetch and parse Letterboxd feeds

Deployment for these will be managed via a separate GitHub Actions workflow.

## Deployment
Deployment is automated via GitHub Actions on every push to main. It uses OIDC to authenticate with AWS and uploads the built app to S3. The final URL is https://film.aryaneja.com

## Notes
This project is a personal development exercise aimed at improving my React and web development skills. It utilizes the [TMDB API](https://www.themoviedb.org/) to provide film data and recommendations.

This product uses the TMDB API but is not endorsed or certified by TMDB.