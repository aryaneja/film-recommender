const LETTERBOXD_API_URL = 'https://xhkw3792g2.execute-api.us-east-1.amazonaws.com/prod/';

export async function saveFilmList(userId, filmList, token) {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dynamodb`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, filmList }),
    });

    if (!response.ok) {
        throw new Error('Failed to save film list.');
    }

    return response.json();
}

export async function loadFilmList(userId, token) {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dynamodb?userId=${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to load film list.');
    }

    return response.json();
}

export async function sendChatMessage(message, chatHistory, filmList, token) {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bedrock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            userMessage: message,
            chatHistory,
            filmList,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send message.');
    }

    const data = await response.json();
    if (data && data.error) {
        throw new Error(data.error);
    }

    return data;
}

export async function fetchLetterboxdFilms(username) {
    const response = await fetch(LETTERBOXD_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.body) {
        return JSON.parse(data.body);
    }
    throw new Error('Invalid API response structure');
}
