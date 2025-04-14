import feedparser
import requests
import os
import json

def get_letterboxd_films(username):
    """
    Fetches and parses the Letterboxd RSS feed for a given username.

    Args:
        username: The Letterboxd username.

    Returns:
        A list of film titles, or None if an error occurs.
    """
    try:
        rss_url = f"https://letterboxd.com/{username}/rss/"
        response = requests.get(rss_url)
        response.raise_for_status()

        feed = feedparser.parse(response.content)

        films = []
        for entry in feed.entries:
            print("Full title:", entry.title)  # Optional debug log
            film_title = entry.title.split(',')[0].strip()
            films.append(film_title)

        return films

    except requests.exceptions.RequestException as e:
        print(f"Error fetching RSS feed: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None

def lambda_handler(event, context):
    try:
        # Log the entire event for debugging
        print("Received event:", json.dumps(event))

        # Parse the incoming JSON body
        body = event.get("body", {})
        if isinstance(body, str):
            body = json.loads(body)

        username = body.get("username")

        if not username:
            return {
                "statusCode": 400,
                "body": json.dumps("Missing 'username' in event data."),
            }

        films = get_letterboxd_films(username)

        if films is not None:
            return {
                "statusCode": 200,
                "body": json.dumps(films),
            }
        else:
            return {
                "statusCode": 500,
                "body": json.dumps("Failed to retrieve or parse films."),
            }
    except Exception as e:
        print(f"Unhandled exception: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps(f"An error occurred: {e}"),
        }