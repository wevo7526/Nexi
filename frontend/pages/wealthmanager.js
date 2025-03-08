"use client";
import React, { useState } from "react";
import axios from "axios";
import WealthManagerChatHistory from "../components/WealthManagerChatHistory";
import WealthManagerMainContent from "../components/WealthManagerMainContent";

function WealthManager() {
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false); // Track loading state

    const handleGetAnswer = async () => {
        setLoading(true); // Show loading spinner
        try {
            const response = await axios.post("http://127.0.0.1:5000/get_wealth_answer", {
                query: query,
                chat_history: chatHistory,
                thread_id: "default",
            });
            setAnswer(response.data.answer);
            setChatHistory([...chatHistory, { query, answer: response.data.answer }]);
        } catch (error) {
            console.error("Error getting answer:", error);
        } finally {
            setLoading(false); // Hide loading spinner
        }
    };

    const handleSelectChat = (index) => {
        const selectedChat = chatHistory[index];
        setQuery(selectedChat.query);
        setAnswer(selectedChat.answer);
    };

    return (
        <div className="wealth-manager">
            <WealthManagerChatHistory chatHistory={chatHistory} onSelectChat={handleSelectChat} />
            <WealthManagerMainContent
                query={query}
                setQuery={setQuery}
                answer={answer}
                loading={loading}
                handleGetAnswer={handleGetAnswer}
            />

            <style jsx>{`
                .wealth-manager {
                    display: flex;
                    min-height: 100vh;
                    background-color: #f7f8fa; /* Light gray background */
                    font-family: "Arial", sans-serif;
                }
            `}</style>
        </div>
    );
}

export default WealthManager;