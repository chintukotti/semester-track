import React from 'react';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import DayTracker from './components/DayTracker';
import Login from './components/Login';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="app">
        <AppContent />
      </div>
    </AppProvider>
  );
}

const AppContent = () => {
  const { user } = useApp();

  return (
    <>
      {user ? (
        <>
          <Header />
          <main className="main-content">
            <DayTracker />
          </main>
        </>
      ) : (
        <Login />
      )}
    </>
  );
};

export default App;