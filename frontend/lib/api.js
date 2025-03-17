import axios from 'axios';
import { supabase } from './supabaseClient';

// Use the same base URL consistently
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with default config
export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor to add auth token
api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        return config;
    } catch (error) {
        console.error('Error getting auth session:', error);
        return Promise.reject(error);
    }
});

// Add response interceptor to handle errors consistently
api.interceptors.response.use(
    (response) => {
        // Check if the response has a success flag and it's false
        if (response.data && response.data.success === false) {
            return Promise.reject(new Error(response.data.error || 'Unknown error occurred'));
        }
        return response;
    },
    (error) => {
        // Handle network errors or other axios errors
        if (!error.response) {
            if (error.code === 'ECONNREFUSED') {
                console.error('Connection refused. Is the backend server running?');
                return Promise.reject(new Error('Backend server is not running. Please try again later.'));
            }
            if (error.code === 'ECONNABORTED') {
                console.error('Connection timed out');
                return Promise.reject(new Error('Request timed out. Please try again.'));
            }
            if (error.code === 'ERR_NETWORK') {
                console.error('Network error. Please check your connection and try again.');
                return Promise.reject(new Error('Network error. Please check your connection and try again.'));
            }
        }

        // Handle response errors
        const errorMessage = error.response?.data?.error || error.message || 'Network error occurred';
        console.error('API Error:', error);
        return Promise.reject(new Error(errorMessage));
    }
);

// Health check function
export const checkApiHealth = async () => {
    try {
        const response = await api.get('/api/health', {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Health check failed:', error);
        throw error;
    }
};

// Document API functions
export const uploadDocument = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/api/upload_document', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
};

export const getDocuments = async () => {
    try {
        const response = await api.get('/api/get_documents');
        return response.data;
    } catch (error) {
        console.error('Error getting documents:', error);
        throw error;
    }
};

export const deleteDocument = async (documentId) => {
    try {
        const response = await api.delete(`/api/delete_document/${documentId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
};

export const getDocumentStatus = async (documentId) => {
    try {
        const response = await api.get(`/api/document_status/${documentId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting document status:', error);
        throw error;
    }
};

export const searchDocuments = async (query) => {
    try {
        const response = await api.post('/api/search_documents', { query });
        return response.data;
    } catch (error) {
        console.error('Error searching documents:', error);
        throw error;
    }
}; 