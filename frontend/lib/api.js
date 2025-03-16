import axios from 'axios';
import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    // Add CORS config
    validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept all status codes less than 500
    }
});

// Add request interceptor to add auth token
api.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
        // Ensure CORS headers are present
        config.headers['Access-Control-Allow-Credentials'] = true;
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
        const errorMessage = error.response?.data?.error || error.message || 'Network error occurred';
        return Promise.reject(new Error(errorMessage));
    }
);

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
        throw error;
    }
};

export const getDocuments = async () => {
    try {
        const response = await api.get('/api/get_documents');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteDocument = async (documentId) => {
    try {
        const response = await api.delete(`/api/delete_document/${documentId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getDocumentStatus = async (documentId) => {
    try {
        const response = await api.get(`/api/document_status/${documentId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const searchDocuments = async (query) => {
    try {
        const response = await api.post('/api/search_documents', { query });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default api; 