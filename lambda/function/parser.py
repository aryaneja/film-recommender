import feedparser
import requests
import os

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
        response.raise_for_status()  # Raise an exception for bad status codes

        feed = feedparser.parse(response.content)

        films = []
        for entry in feed.entries:
            title_parts = entry.title.split(' – ')
            if len(title_parts) > 1:
              film_title = title_parts[0]
              films.append(film_title)
            
        return films

    except requests.exceptions.RequestException as e:
        print(f"Error fetching RSS feed: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None

def lambda_handler(event, context):
    """
    AWS Lambda handler function.

    Args:
        event: The event data passed to the Lambda function.
        context: The runtime information of the Lambda function.

    Returns:
        A dictionary containing the parsed film list or an error message.
    """
    try:
        username = event.get("username")
        if not username:
            return {
                "statusCode": 400,
                "body": "Missing 'username' in event data.",
            }

        films = get_letterboxd_films(username)

        if films is not None:
            return {
                "statusCode": 200,
                "body": films,
            }
        else:
            return {
                "statusCode": 500,
                "body": "Failed to retrieve or parse films.",
            }
    except Exception as e:
        print(f"Unhandled exception: {e}")
        return {
            "statusCode": 500,
            "body": f"An error occurred: {e}",
        }