import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { FaGoogle, FaSpinner, FaGraduationCap, FaBook } from 'react-icons/fa';

const Login = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, authInitialized } = useApp();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Use the Google user info to login
      await login(firebaseUser.email, 'google-auth', {
        id: firebaseUser.uid,
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL
      });
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state if auth is not initialized or user is logging in
  if (!authInitialized || isLoading) {
    return (
      <div className="login-container">
        <div className="login-form">
          <div className="login-logo">
            <FaGraduationCap className="login-logo-icon" />
            <FaBook className="login-logo-book-icon" />
          </div>
          <h1>SemesterTrack</h1>
          <p>Academic Semester Planner</p>
          <div className="loading-spinner">
            <FaSpinner className="spinner-icon" />
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't show login form
  if (user) {
    return null;
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-logo">
          <FaGraduationCap className="login-logo-icon" />
          <FaBook className="login-logo-book-icon" />
        </div>
        <h1>Welcome to SemesterTrack</h1>
        <p>Track your semester progress and manage your academic schedule</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <button className="google-signin-btn" onClick={handleGoogleSignIn} disabled={isLoading}>
          {isLoading ? (
            <>
              <FaSpinner className="spinner" />
              Signing in...
            </>
          ) : (
            <>
              <FaGoogle className="google-icon" />
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Login;