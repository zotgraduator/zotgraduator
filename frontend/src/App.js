import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import './styles/Account.css';
import './styles/AboutUs.css';
import './styles/Legal.css';
import Optimizer from './pages/Optimizer';
import Visualizer from './pages/Visualizer';
import Social from './pages/Social';
import Planner from './pages/Planner'; // Import the new Planner component
import Account from './pages/Account';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutUs from './pages/AboutUs';
import logo from './logo.png';
import Login from './pages/Login';
import SignUpPage from './pages/SignUp';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Link to="/">
          <img src={logo} alt="Zotgraduator Logo" className="App-logo" />
        </Link>
        <nav>
          <Link to="/optimizer">Optimizer</Link>
          <Link to="/planner">Planner</Link> {/* Add new Planner link */}
          <Link to="/visualizer">Visualizer</Link>
          <Link to="/social">Social</Link>
          <Link to="/account">Account</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/optimizer" element={<Optimizer />} />
          <Route path="/planner" element={<Planner />} /> {/* Add new Planner route */}
          <Route path="/visualizer" element={<Visualizer />} />
          <Route path="/social" element={<Social />} />
          <Route path="/account" element={<Account />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/about" element={<AboutUs />} />
        </Routes>
      </main>
      <footer>
        <Link to="/terms">Terms and Conditions</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/about">About Us</Link>
      </footer>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="Dashboard">
      <section className="hero-section">
        <h1>ZOTGRADUATOR</h1>
        <p className="Tagline">Your path to graduation, simplified.</p>
        <button className="cta-button" onClick={() => navigate('/login')}>Get Started</button>
      </section>

      <section className="mission-section">
        <h2>Our Mission</h2>
        <p>We help UCI students plan their academic journey efficiently, ensuring they meet all graduation requirements while balancing their interests and career goals.</p>
      </section>

      <section className="features-section">
        <h2>Features</h2>
        <div className="features-container">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Course Planning</h3>
            <p>Plan your courses each quarter to stay on track for graduation.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🗓️</div>
            <h3>Schedule Optimization</h3>
            <p>Create conflict-free schedules that work with your preferences.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Community Advice</h3>
            <p>Connect with peers and get advice on courses and professors.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
