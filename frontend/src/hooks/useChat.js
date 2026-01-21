import { useState, useCallback, useRef } from 'react';
import { sendChatMessage } from '../services/backendApi';

export function useChat(userFilmList) {
    const [chatHistory, setChatHistory] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const chatWindowRef = useRef(null);

    const handleSendMessage = useCallback(async (message, token, isBackground = false) => {
        let msg = typeof message === 'string' ? message : userMessage;

        if (typeof msg !== 'string') {
            setError('Chat input must be text. Please enter a message.');
            return;
        }

        msg = msg.trim();
        if (!msg) {
            setError('Please enter a message to send.');
            return;
        }

        setLoading(true);
        setError(null);

        if (!isBackground) {
            setChatHistory(prev => [...prev, { human: msg, assistant: '' }]);
            setUserMessage('');
        }

        try {
            const data = await sendChatMessage(msg, chatHistory, userFilmList, token);

            setChatHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1].assistant = data;
                return updated;
            });

            return data;
        } catch (err) {
            setError(err.message || 'Failed to send message');
            if (!isBackground) {
                setChatHistory(prev => prev.slice(0, -1));
            }
        } finally {
            setLoading(false);
        }
    }, [userMessage, chatHistory, userFilmList]);

    return {
        chatHistory,
        setChatHistory,
        userMessage,
        setUserMessage,
        loading,
        error,
        setError,
        chatWindowRef,
        handleSendMessage,
    };
}
