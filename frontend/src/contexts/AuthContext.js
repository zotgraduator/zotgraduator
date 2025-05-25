import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://zotgraduator-api.vercel.app/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data.user);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { user, access_token, refresh_token } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Failed to login');
      throw new Error(err.response?.data?.error || 'Failed to login');
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      const { user, access_token, refresh_token } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.error || 'Failed to create account');
      throw new Error(err.response?.data?.error || 'Failed to create account');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
