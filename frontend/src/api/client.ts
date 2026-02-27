import axios from 'axios';

// Create a configured axios instance
const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/v1', // Our local FastAPI server
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach the JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
