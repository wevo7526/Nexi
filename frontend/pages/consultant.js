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
    const [file, setFile] = useState(null); // Track selected file

    const handleGetAnswer = async () => {
        setLoading(true); // Show loading spinner
        const formData = new FormData();
        formData.append("query", query);
        formData.append("chat_history", JSON.stringify(chatHistory));
        formData.append("thread_id", "default");
        if (file) {
            formData.append("file", file);
        }

        try {
            const response = await axios.post("http://127.0.0.1:5000/get_answer", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
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

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        console.log("Selected file:", selectedFile); // Debugging line
        setFile(selectedFile);
    };

    return (
        <div className="consultant">
            <header className="header">
                <h1>Consultant Dashboard</h1>
            </header>
            <div className="content">
                <div className="sidebar">
                    <ChatHistory chatHistory={chatHistory} onSelectChat={handleSelectChat} />
                </div>
                <div className="main-content">
                    <MainContent
                        query={query}
                        setQuery={setQuery}
                        answer={answer}
                        loading={loading}
                        handleGetAnswer={handleGetAnswer}
                    />
                    <div className="file-upload">
                        <input type="file" accept=".docx,.pdf,.xls,.xlsx,.ppt,.pptx" onChange={handleFileChange} />
                        <button onClick={handleGetAnswer}>Upload Document and Get Answer</button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .consultant {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: #eef5ff;
                    font-family: "Arial", sans-serif;
                }
                .header {
                    text-align: center;
                    padding: 20px 0;
                    background-color: #0070f3;
                    color: #fff;
                }
                .content {
                    display: flex;
                    flex: 1;
                }
                .sidebar {
                    width: 20%;
                    background-color: #f7f8fa;
                    padding: 20px;
                    border-right: 1px solid #ddd;
                    overflow-y: auto;
                }
                .main-content {
                    width: 80%;
                    padding: 20px;
                }
                .file-upload {
                    margin-top: 20px;
                }
                .file-upload input {
                    margin-right: 10px;
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
