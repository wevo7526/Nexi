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
    },
    timeout: 30000, // 30 second timeout
    retries: 3, // Number of retries
    retryDelay: 1000, // Delay between retries in ms
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
    async (error) => {
        const config = error.config;

        // If we've already retried the maximum number of times, reject
        if (!config || !config.retries) {
            return Promise.reject(error);
        }

        config.retries -= 1;

        // Create new promise to handle retry delay
        const delayRetry = new Promise(resolve => {
            setTimeout(resolve, config.retryDelay || 1000);
        });

        // Wait for delay then retry
        await delayRetry;

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
            if (error.code === 'ERR_BAD_RESPONSE') {
                console.error('Bad response from server');
                return Promise.reject(new Error('Server error. Please try again later.'));
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