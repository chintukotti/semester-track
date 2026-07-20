import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import DayTracker from './components/DayTracker';
import Login from './components/Login';
import SharedView from './components/SharedView';
import { FaGraduationCap, FaBook } from 'react-icons/fa';
import './App.css';

// Check for share ID OUTSIDE of React — runs once on page load
const getShareId = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('share') || null;
  } catch {
    return null;
  }
};

const SHARE_ID = getShareId();

function App() {
  // If it's a shared link, render SharedView WITHOUT AppProvider auth dependency
  if (SHARE_ID) {
    return (
      <AppProvider>
        <div className="app">
          <SharedView shareId={SHARE_ID} />
        </div>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <div className="app">
        <AppContent />
      </div>
    </AppProvider>
  );
}

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-screen-content">
      <div className="loading-logo-box">
        <FaGraduationCap className="loading-logo-icon" />
        <FaBook className="loading-logo-book" />
      </div>
      <h1 className="loading-title">SemesterTrack</h1>
      <p className="loading-subtitle">Loading your academic planner...</p>
      <div className="loading-dots"><span></span><span></span><span></span></div>
    </div>
  </div>
);

const AppContent = () => {
  const { user, authInitialized, loading } = useApp();

  if (!authInitialized) return <LoadingScreen />;
  if (!user) return <Login />;

  return (
    <>
      <Header />
      <main className="main-content">
        {loading ? (
          <div className="data-loading">
            <div className="data-loading-spinner"></div>
            <p>Loading your semesters...</p>
          </div>
        ) : (
          <DayTracker />
        )}
      </main>
    </>
  );
};

export default App;