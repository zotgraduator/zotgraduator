import React, { useState } from 'react';         // handle local component state
import { useNavigate } from 'react-router-dom';  // for page navigation
import { useFormik } from 'formik';             // form management
import { CircularProgress } from '@mui/material';// loading indicator
import { useAuth } from '../contexts/AuthContext';
import '../styles/Account.css';                   // reuse Account form styles

/**
def Login() -> JSX.Element:
"""Component that handles user login, with navigation to sign up or optimizer

Args:
None

Returns:
React JSX element rendering the login page
Raises:
None
"""
*/
function Login() {
  const navigate = useNavigate();                    // used to navigate between routes
  const { login } = useAuth();                       // grab the login function from context
  const [loading, setLoading] = useState(false);     // track loading state

    
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    onSubmit: async (values) => {
      setLoading(true);                                // show spinner while authenticating
      try {
        await login(values.email, values.password); // attempt login
        navigate('/optimizer');                        // upon success, go to optimizer
      } catch (err) {
        console.error('login failed', err);           // log error
        alert('Login error: ' + err.message);         // simple user alert
      } finally {
        setLoading(false);                             // always stop spinner
      }
    }
  });

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login</h2>
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

          <button type="submit" className="primary-button">
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