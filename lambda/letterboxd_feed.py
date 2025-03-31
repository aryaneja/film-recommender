import feedparser
import requests
from datetime import datetime, timedelta
import os

def get_letterboxd_recent_films(username, num_films=5):
    print('executed get_letterboxd_recent_films')
    """
    Retrieves a user's most recently watched films from their Letterboxd RSS feed.

    Args:
        username (str): The Letterboxd username.
        num_films (int): The number of recent films to retrieve.

    Returns:
        list: A list of dictionaries, where each dictionary represents a film
              and contains 'title', 'year', and 'link'.
              Returns an empty list if there's an error.
    """
    try:
        feed_url = f"https://letterboxd.com/{username}/rss/"
        response = requests.get(feed_url, timeout=10)  # Added timeout
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)

        feed = feedparser.parse(response.text)

        if feed.bozo:  # Check for parsing errors
            print(f"Error parsing RSS feed: {feed.bozo_exception}")
            return []

        films = []
        for entry in feed.entries[:num_films]:
            title_parts = entry.title.split(" – ")
            film_title = title_parts[0]
            year = title_parts[1] if len(title_parts) > 1 else "N/A"
            film_link = entry.link
            films.append({"title": film_title, "year": year, "link": film_link})

        return films

    except requests.exceptions.RequestException as e:
        print(f"Error fetching RSS feed: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []

def lambda_handler(event, context):
  """
  Lambda handler function that calls get_letterboxd_recent_films
  with a username.
  """
  username = os.environ.get("LETTERBOXD_USERNAME") #get username from lambda environmet variable
  if username is None:
    return {
        'statusCode': 400,
        'body': "LETTERBOXD_USERNAME not set in the environment"
    }

  recent_films = get_letterboxd_recent_films(username)
  return {
      'statusCode': 200,
      'body': recent_films
  }