import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import { CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Account.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
    
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      try {
        await login(values.email, values.password);
        navigate('/optimizer');
      } catch (err) {
        console.error('Login failed:', err);
        setError(err.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={formik.handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              onChange={formik.handleChange}
              value={formik.values.email}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              onChange={formik.handleChange}
              value={formik.values.password}
              required
            />
          </div>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Login'}
          </button>
        </form>

        <p className="form-footer">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="text-button"
            onClick={() => navigate('/signup')}
          >
            Create Account
          </button>
        </p>

        <button
          type="button"
          className="secondary-button"
          style={{ width: '100%', marginTop: '1rem' }}
          onClick={() => navigate('/optimizer')}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

export default Login;