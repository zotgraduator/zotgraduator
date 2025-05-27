import axios from 'axios';

// Use environment variable with fallback to deployed backend URL
const API_URL = process.env.REACT_APP_API_URL || 'https://zotgraduator-backend.vercel.app/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Try to get a new access token
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${refreshToken}`
          }
        });
        
        const { access_token } = response.data;
        localStorage.setItem('accessToken', access_token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log user out
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API services
const services = {
  // Auth services
  auth: {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile')
  },
  
  // Course services
  courses: {
    getAll: (page = 1, perPage = 50) => api.get(`/courses?page=${page}&per_page=${perPage}`),
    getById: (classId) => api.get(`/courses/${classId}`),
    search: (query) => api.get(`/courses/search?q=${query}`),
    getPrerequisites: (classId) => api.get(`/courses/prerequisites/${classId}`),
    getByDepartment: (dept) => api.get(`/courses/department/${dept}`)
  },
  
  // Plan services
  plans: {
    getAll: () => api.get('/plans'),
    getById: (id) => api.get(`/plans/${id}`),
    create: (planData) => api.post('/plans', planData),
    update: (id, planData) => api.put(`/plans/${id}`, planData),
    delete: (id) => api.delete(`/plans/${id}`),
    validate: (planData) => api.post('/plans/validate', planData),
    optimize: (constraints) => api.post('/plans/optimize', constraints)
  },
  
  // Schedule services
  schedules: {
    getAll: () => api.get('/schedules'),
    getById: (id) => api.get(`/schedules/${id}`),
    getByPlan: (planId) => api.get(`/schedules/plan/${planId}`),
    create: (scheduleData) => api.post('/schedules', scheduleData),
    update: (id, scheduleData) => api.put(`/schedules/${id}`, scheduleData),
    delete: (id) => api.delete(`/schedules/${id}`),
    validate: (scheduleData) => api.post('/schedules/validate', scheduleData),
    optimize: (constraints) => api.post('/schedules/optimize', constraints)
  },
  
  // Planner services - new!
  planner: {
    generatePlan: (planData) => api.post('/planner/generate', planData),
    getCourseAvailability: () => api.get('/planner/course-availability'),
    getCompletedSuggestions: () => api.get('/planner/completed-suggestions')
  }
};

export default services;
