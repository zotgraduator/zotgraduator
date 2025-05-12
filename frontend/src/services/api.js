import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000'
});

// Add interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Make sure to use the correct URL for refresh endpoint
          const response = await axios.post('http://localhost:5000/api/auth/refresh', { 
            refresh_token: refreshToken 
          });
          
          // Update the token
          const { access_token } = response.data;
          localStorage.setItem('token', access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          
          // Retry the original request
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log out the user
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Add a request interceptor to set the token for every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
