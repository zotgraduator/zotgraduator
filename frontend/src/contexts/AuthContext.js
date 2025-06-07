import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../supabase/supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    checkUser();

    // Set up auth listener - avoid async operations in callback to prevent deadlock
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Supabase auth event: ${event}`);
        
        // Use setTimeout to defer async operations and avoid deadlock
        setTimeout(async () => {
          if (session?.user) {
            try {
              const { data: userData, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', session.user.email)
                .single();

              if (error) {
                console.error('Error fetching user data:', error);
                setCurrentUser(null);
              } else {
                setCurrentUser(userData);
              }
            } catch (err) {
              console.error('Error in auth state change:', err);
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
          setLoading(false);
        }, 0);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
        } else {
          setCurrentUser(userData);
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // User data will be set by the auth state change listener
      // Don't manually set it here to avoid conflicts
      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      throw new Error(err.message || 'Failed to login');
    }
  };

  const signup = async (userData) => {
    try {
      setError('');
      
      // Check if username already exists before proceeding
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', userData.username)
        .single();

      if (existingUser) {
        throw new Error('Username already exists. Please choose a different username.');
      }

      // First register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) throw error;

      // Then store additional user data in our custom users table
      const { error: insertError } = await supabase.from('users').insert([
        {
          email: userData.email,
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
          major: userData.major,
          year: userData.year,
          password_hash: 'Managed by Supabase Auth' // We don't actually store the password here
        }
      ]);

      if (insertError) {
        // Handle specific database constraint errors
        if (insertError.code === '23505') { // PostgreSQL unique constraint violation
          if (insertError.message.includes('users_username_key')) {
            throw new Error('Username already exists. Please choose a different username.');
          } else if (insertError.message.includes('users_email_key')) {
            throw new Error('Email already exists. Please use a different email address.');
          }
        }
        throw insertError;
      }

      // User data will be set by the auth state change listener
      // Don't manually set it here to avoid conflicts
      return data;
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err.message || 'Failed to create account';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // User will be cleared by the auth state change listener
    } catch (err) {
      console.error('Logout error:', err);
    }
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
