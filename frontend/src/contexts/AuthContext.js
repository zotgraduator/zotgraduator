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

    // Set up auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Supabase auth event: ${event}`);
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
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      if (authListener) authListener.subscription.unsubscribe();
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

      // Get user profile data from our custom users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) throw userError;
      
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      throw new Error(err.message || 'Failed to login');
    }
  };

  const signup = async (userData) => {
    try {
      setError('');
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

      if (insertError) throw insertError;

      // Get the newly created user data
      const { data: newUserData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();

      if (fetchError) throw fetchError;

      setCurrentUser(newUserData);
      return newUserData;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
      throw new Error(err.message || 'Failed to create account');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
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
