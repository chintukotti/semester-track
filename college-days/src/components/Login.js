import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import {
  FaGoogle, FaSpinner, FaGraduationCap, FaBook,
  FaCalendarCheck, FaChartLine, FaClock, FaShieldAlt,
  FaSun, FaMoon
} from 'react-icons/fa';

const Login = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useApp();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Theme toggle on login page */}
      <button
        className="login-theme-toggle"
        onClick={toggleTheme}
        title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      >
        {theme === 'light' ? <FaMoon /> : <FaSun />}
      </button>

      {/* Left hero panel (desktop only) */}
      <div className="login-hero">
        <div className="login-hero-content">
          <div className="login-hero-logo">
            <FaGraduationCap className="hero-grad-icon" />
            <FaBook className="hero-book-icon" />
          </div>
          <h1>SemesterTrack</h1>
          <p className="hero-tagline">Your Academic Journey, Organized</p>
          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-icon"><FaCalendarCheck /></div>
              <div>
                <h3>Track Every Day</h3>
                <p>Working days, holidays, exams & events</p>
              </div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon"><FaChartLine /></div>
              <div>
                <h3>Visual Progress</h3>
                <p>See your semester progress at a glance</p>
              </div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon"><FaClock /></div>
              <div>
                <h3>Stay on Schedule</h3>
                <p>Never miss an important academic date</p>
              </div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon"><FaShieldAlt /></div>
              <div>
                <h3>Cloud Synced</h3>
                <p>Accessible anywhere, safely stored</p>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="hero-circle hero-circle-1"></div>
          <div className="hero-circle hero-circle-2"></div>
          <div className="hero-circle hero-circle-3"></div>
        </div>
      </div>

      {/* Right sign-in panel */}
      <div className="login-panel">
        <div className="login-card">
          <div className="login-card-logo">
            <FaGraduationCap />
          </div>
          <h2>Welcome Back</h2>
          <p className="login-card-subtitle">
            Sign in to continue to your academic planner
          </p>

          {error && <div className="login-error">{error}</div>}

          <button
            className="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FaSpinner className="btn-spinner" />
                Signing in...
              </>
            ) : (
              <>
                <div className="google-icon-box"><FaGoogle /></div>
                Continue with Google
              </>
            )}
          </button>

          <div className="login-divider">
            <span>Secure authentication by Google</span>
          </div>

          <p className="login-terms">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;