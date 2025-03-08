"use client";
import React, { useState } from "react";
import axios from "axios";
import ChatHistory from "../components/ChatHistory";
import MainContent from "../components/MainContent";

function Consultant({ initialData }) {
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState("");
    const [chatHistory, setChatHistory] = useState(initialData.chatHistory || []);
    const [loading, setLoading] = useState(false); // Track loading state

    const handleGetAnswer = async () => {
        setLoading(true); // Show loading spinner
        try {
            const response = await axios.post("http://127.0.0.1:5000/get_answer", {
                query: query,
                chat_history: chatHistory.map(chat => ({
                    role: "user",
                    content: chat.query
                })),
                thread_id: "default",
            });
            const newAnswer = {
                role: "assistant",
                content: response.data.answer
            };
            setAnswer(newAnswer.content);
            setChatHistory([...chatHistory, { query, answer: newAnswer.content }]);
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
        <div className="consultant">
            <ChatHistory chatHistory={chatHistory} onSelectChat={handleSelectChat} />
            <MainContent
                query={query}
                setQuery={setQuery}
                answer={answer}
                loading={loading}
                handleGetAnswer={handleGetAnswer}
            />

            <style jsx>{`
                .consultant {
                    display: flex;
                    min-height: 100vh;
                    background-color: #f7f8fa; /* Light gray background */
                    font-family: "Arial", sans-serif;
                }
            `}</style>
        </div>
    );
}

export async function getServerSideProps() {
    // Fetch initial data for the page
    const initialData = { chatHistory: [] }; // Replace with actual data fetching logic
    return { props: { initialData } };
}

export default Consultant;
