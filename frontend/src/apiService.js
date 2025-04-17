const API_BASE_URL = "https://xhkw3792g2.execute-api.us-east-1.amazonaws.com/prod/";

export async function fetchFilms(username) {
    try {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch films:", error);
        throw error;
    }
}

export async function getBedrockRecommendations(userPreferences) {
    try {
        const response = await fetch(`${API_BASE_URL}bedrock`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userPreferences }),
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch films:", error);
        throw error;
    }
}