import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on page load
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/api/auth/profile');
          setCurrentUser(response.data.user);
        } catch (error) {
          // If there's an error, just log out the user
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { user, access_token, refresh_token } = response.data;
      
      // Store auth data
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set current user
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { user, access_token, refresh_token } = response.data;
      
      // Store auth data
      localStorage.setItem('token', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set current user
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
