import React, { useEffect } from 'react';

export function ChatWindow({
    chatHistory,
    userMessage,
    setUserMessage,
    onSendMessage,
    loading,
    chatWindowRef,
    isAuthenticated,
}) {
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [chatHistory, loading, chatWindowRef]);

    const renderText = (text) =>
        typeof text === 'string'
            ? text.split(/\n|\\n/g).map((line, i, arr) => (
                <React.Fragment key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                </React.Fragment>
            ))
            : JSON.stringify(text);

    if (!isAuthenticated) {
        return (
            <div className="chat-container">
                <p>Please sign in to use the AI chatbot and get personalized recommendations.</p>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-group-bubbles chat-scrollable" ref={chatWindowRef}>
                {chatHistory.map((turn, index) => (
                    <React.Fragment key={index}>
                        <div className="chat-bubble user-bubble">
                            <span className="bubble-avatar" role="img" aria-label="User">
                                {'\u{1F642}'}
                            </span>
                            <span className="bubble-label">You</span>
                            <span className="bubble-text">{renderText(turn.human)}</span>
                        </div>
                        <div className="chat-bubble ai-bubble">
                            <span className="bubble-avatar" role="img" aria-label="AI">
                                {'\u{1F916}'}
                            </span>
                            <span className="bubble-label">Claude</span>
                            <span className="bubble-text">{renderText(turn.assistant)}</span>
                        </div>
                    </React.Fragment>
                ))}
                {loading && (
                    <div className="chat-bubble ai-bubble typing-indicator">
                        <span className="bubble-avatar" role="img" aria-label="AI">
                            {'\u{1F916}'}
                        </span>
                        <span className="bubble-label">Claude</span>
                        <span className="bubble-text">Typing...</span>
                    </div>
                )}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Type your message here..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onSendMessage();
                    }}
                />
                <button onClick={onSendMessage} disabled={loading}>
                    Send
                </button>
            </div>
        </div>
    );
}
