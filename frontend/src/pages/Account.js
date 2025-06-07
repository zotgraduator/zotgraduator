import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { plansService } from '../services/plansService';
import '../styles/Account.css';

function Account() {
  const { currentUser, login, signup, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

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

  // Mock saved schedules
  const [savedSchedules, setSavedSchedules] = useState([
    { id: 1, name: 'Fall 2023', courses: ['COMPSCI 161', 'COMPSCI 171', 'IN4MATX 115'] },
    { id: 2, name: 'Winter 2024', courses: ['COMPSCI 122A', 'COMPSCI 143A', 'STATS 67'] }
  ]);

  // Real saved plans from database
  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // User preferences
  const [preferences, setPreferences] = useState({
    darkMode: false,
    emailNotifications: true,
    showGPA: true,
    scheduleReminders: true
  });

  // Fetch user plans when user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchUserPlans();
    }
  }, [currentUser]);

  const fetchUserPlans = async () => {
    try {
      setLoadingPlans(true);
      const plans = await plansService.getUserPlans();
      setSavedPlans(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Handle editing plans
  const handleEditPlan = (plan) => {
    navigate('/planner', { state: { plan } });
  };

  // Handle deleting plans
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) {
      return;
    }
    
    try {
      await plansService.deletePlan(planId);
      setSavedPlans(prev => prev.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Error deleting plan:', error);
      setSignupError('Failed to delete plan. Please try again.');
    }
  };

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginError('');
      await login(loginData.email, loginData.password);
      setSuccessMessage('Logged in successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setLoginError(error.message);
    }
  };

  // Handle signup form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (signupData.password !== signupData.confirmPassword) {
      return setSignupError('Passwords do not match');
    }

    if (signupData.password.length < 6) {
      return setSignupError('Password should be at least 6 characters');
    }

    if (!signupData.email.includes('@')) {
      return setSignupError('Please enter a valid email address');
    }

    try {
      await signup(signupData);
      
      // Clear signup form
      setSignupData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        major: '',
        year: ''
      });
      
      // Switch to login tab and show email confirmation message
      setActiveTab('login');
      setSuccessMessage('Account created successfully! Please check your email to confirm your account, then sign in.');
      setTimeout(() => setSuccessMessage(''), 8000); // longer timeout for email confirmation message
    } catch (error) {
      setSignupError(error.message);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setSuccessMessage('Logged out successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle form input changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handlePreferenceChange = (e) => {
    const { name, checked, type, value } = e.target;
    setPreferences(prevPrefs => ({
      ...prevPrefs,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Render login form
  const renderLoginForm = () => (
    <div className="auth-form">
      <h2>Sign In</h2>
      {loginError && <div className="error-message">{loginError}</div>}
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={loginData.email}
            onChange={handleLoginChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={loginData.password}
            onChange={handleLoginChange}
            required
          />
        </div>
        <button type="submit" className="primary-button">Sign In</button>
      </form>
      <p className="form-footer">
        Don't have an account? <button className="text-button" onClick={() => setActiveTab('signup')}>Sign Up</button>
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
  );

  // Render signup form
  const renderSignupForm = () => (
    <div className="auth-form">
      <h2>Create Account</h2>
      {signupError && <div className="error-message">{signupError}</div>}
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
        <button type="submit" className="primary-button">Create Account</button>
      </form>
      <p className="form-footer">
        Already have an account? <button className="text-button" onClick={() => setActiveTab('login')}>Sign In</button>
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
  );

  // Render user profile
  const renderProfile = () => (
    <div className="profile-section">
      <h2>My Profile</h2>
      <div className="profile-info">
        <div className="info-group">
          <label>Name</label>
          <p>{currentUser.first_name} {currentUser.last_name}</p>
        </div>
        <div className="info-group">
          <label>Username</label>
          <p>{currentUser.username}</p>
        </div>
        <div className="info-group">
          <label>Email</label>
          <p>{currentUser.email || 'Not set'}</p>
        </div>
        <div className="info-group">
          <label>Major</label>
          <p>{currentUser.major || 'Not set'}</p>
        </div>
        <div className="info-group">
          <label>Year</label>
          <p>{currentUser.year || 'Not set'}</p>
        </div>
      </div>
      <div className="profile-actions">
        <button className="secondary-button">Edit Profile</button>
        <button className="danger-button" onClick={handleLogout}>Sign Out</button>
      </div>
    </div>
  );

  // Render saved schedules
  const renderSchedules = () => (
    <div className="schedules-section">
      <h2>Saved Schedules</h2>
      <div className="saved-items-list">
        {savedSchedules.length > 0 ? (
          savedSchedules.map(schedule => (
            <div key={schedule.id} className="saved-item">
              <div className="saved-item-header">
                <h3>{schedule.name}</h3>
                <div className="saved-item-actions">
                  <button className="icon-button">✏️</button>
                  <button className="icon-button">🗑️</button>
                </div>
              </div>
              <div className="saved-item-details">
                <p><strong>Courses:</strong> {schedule.courses.join(', ')}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No saved schedules yet.</p>
        )}
      </div>
      <button className="primary-button">Create New Schedule</button>
    </div>
  );

  // Render saved academic plans
  const renderPlans = () => (
    <div className="plans-section">
      <h2>Saved Academic Plans</h2>
      <div className="saved-items-list">
        {loadingPlans ? (
          <p className="loading-state">Loading plans...</p>
        ) : savedPlans.length > 0 ? (
          savedPlans.map(plan => (
            <div key={plan.id} className="saved-item">
              <div className="saved-item-header">
                <h3>{plan.name}</h3>
                <div className="saved-item-actions">
                  <button 
                    className="icon-button" 
                    onClick={() => handleEditPlan(plan)}
                    title="Edit plan"
                  >
                    ✏️
                  </button>
                  <button 
                    className="icon-button" 
                    onClick={() => handleDeletePlan(plan.id)}
                    title="Delete plan"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="saved-item-details">
                <p>{plan.description || 'No description'}</p>
                <p><strong>Start Year:</strong> {plan.start_year}</p>
                <p><strong>Duration:</strong> {plan.planned_years} years</p>
                <p><strong>Created:</strong> {new Date(plan.created_at).toLocaleDateString()}</p>
                {plan.updated_at && plan.updated_at !== plan.created_at && (
                  <p><strong>Last Updated:</strong> {new Date(plan.updated_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No saved academic plans yet.</p>
        )}
      </div>
      <button 
        className="primary-button"
        onClick={() => navigate('/planner')}
      >
        Create New Plan
      </button>
    </div>
  );

  // Render preferences
  const renderPreferences = () => (
    <div className="preferences-section">
      <h2>Preferences</h2>
      <form>
        <div className="preference-group">
          <label>
            <input
              type="checkbox"
              name="darkMode"
              checked={preferences.darkMode}
              onChange={handlePreferenceChange}
            />
            Dark Mode
          </label>
        </div>
        <div className="preference-group">
          <label>
            <input
              type="checkbox"
              name="emailNotifications"
              checked={preferences.emailNotifications}
              onChange={handlePreferenceChange}
            />
            Email Notifications
          </label>
        </div>
        <div className="preference-group">
          <label>
            <input
              type="checkbox"
              name="showGPA"
              checked={preferences.showGPA}
              onChange={handlePreferenceChange}
            />
            Show GPA in Dashboard
          </label>
        </div>
        <div className="preference-group">
          <label>
            <input
              type="checkbox"
              name="scheduleReminders"
              checked={preferences.scheduleReminders}
              onChange={handlePreferenceChange}
            />
            Schedule Reminders
          </label>
        </div>
        <button type="button" className="primary-button">Save Preferences</button>
      </form>
    </div>
  );

  return (
    <div className="account-page">
      <h1 className="page-title">My Account</h1>
      
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {!currentUser ? (
        <div className="auth-container">
          {activeTab === 'login' ? renderLoginForm() : renderSignupForm()}
        </div>
      ) : (
        <div className="account-container">
          <div className="account-sidebar">
            <button 
              className={`sidebar-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`sidebar-button ${activeTab === 'schedules' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedules')}
            >
              Saved Schedules
            </button>
            <button 
              className={`sidebar-button ${activeTab === 'plans' ? 'active' : ''}`}
              onClick={() => setActiveTab('plans')}
            >
              Academic Plans
            </button>
            <button 
              className={`sidebar-button ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
          </div>
          <div className="account-content">
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'schedules' && renderSchedules()}
            {activeTab === 'plans' && renderPlans()}
            {activeTab === 'preferences' && renderPreferences()}
          </div>
        </div>
      )}
    </div>
  );
}

export default Account;
