import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Account.css';

function SignUpPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Signup form state
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    major: '',
    year: ''
  });

  // Handle signup form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password should be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await signup(signupData);
      setSuccessMessage('Account created successfully!');
      // Redirect after successful signup
      setTimeout(() => {
        navigate('/optimizer');
      }, 1500);
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create an account.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  return (
    <div className="account-page">
      <h1 className="page-title">Create Account</h1>
      
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      <div className="auth-container">
        <div className="auth-form">
          <h2>Sign Up</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSignup}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={signupData.firstName}
                  onChange={handleSignupChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={signupData.lastName}
                  onChange={handleSignupChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-username">Username</label>
              <input
                type="text"
                id="signup-username"
                name="username"
                value={signupData.username}
                onChange={handleSignupChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={signupData.email}
                onChange={handleSignupChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="major">Major</label>
                <input
                  type="text"
                  id="major"
                  name="major"
                  value={signupData.major}
                  onChange={handleSignupChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="year">Year</label>
                <select
                  id="year"
                  name="year"
                  value={signupData.year}
                  onChange={handleSignupChange}
                  required
                >
                  <option value="">Select Year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                value={signupData.password}
                onChange={handleSignupChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                required
              />
            </div>
            <button 
              type="submit" 
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          <p className="form-footer">
            Already have an account? <button className="text-button" onClick={() => navigate('/login')}>Sign In</button>
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
    </div>
  );
}

export default SignUpPage;