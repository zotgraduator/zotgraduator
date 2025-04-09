import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the auth context
const AuthContext = createContext();

// Mock user data
const mockUser = {
  username: 'test',
  email: 'test@uci.edu',
  firstName: 'Peter',
  lastName: 'Anteater',
  major: 'Computer Science',
  year: 'Senior',
  studentId: '12345678',
};

// Auth provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Mock login function
  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === 'test' && password === 'test') {
          localStorage.setItem('currentUser', JSON.stringify(mockUser));
          setCurrentUser(mockUser);
          resolve(mockUser);
        } else {
          reject(new Error('Invalid username or password'));
        }
      }, 500); // Simulate network delay
    });
  };

  // Mock signup function
  const signup = (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = { ...userData };
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        setCurrentUser(newUser);
        resolve(newUser);
      }, 500); // Simulate network delay
    });
  };

  // Mock logout function
  const logout = () => {
    localStorage.removeItem('currentUser');
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

// Custom hook for using auth context
export function useAuth() {
  return useContext(AuthContext);
}
