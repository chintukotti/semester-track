import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import {
  FaGraduationCap, FaBook, FaBriefcase, FaUmbrellaBeach,
  FaCalendarAlt, FaPen, FaCalendarDay, FaHourglassHalf,
  FaStar, FaSpinner, FaExclamationTriangle, FaArrowRight
} from 'react-icons/fa';

// Safely convert any date format to JS Date
const toDateSafe = (val) => {
  if (!val) return new Date();
  // Firestore Timestamp
  if (val && typeof val === 'object' && val.seconds) {
    return new Date(val.seconds * 1000);
  }
  // Firestore Timestamp with toDate method
  if (val && typeof val.toDate === 'function') {
    return val.toDate();
  }
  // Already a Date
  if (val instanceof Date) return val;
  // String
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    // Handle 'yyyy-MM-dd' format with timezone fix
    const parts = val.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  // Number (timestamp)
  if (typeof val === 'number') return new Date(val);
  return new Date();
};

const SharedView = ({ shareId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching shared semester:', shareId);
        const ref = doc(db, 'sharedSemesters', shareId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const docData = snap.data();
          console.log('Shared data loaded:', docData);
          setData(docData);
        } else {
          console.log('Shared document not found');
          setError('This shared link is invalid or has expired.');
        }
      } catch (err) {
        console.error('Error fetching shared data:', err);
        if (err.code === 'permission-denied') {
          setError('Access denied. The Firestore security rules may need to be updated.');
        } else {
          setError('Failed to load shared semester. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchData();
    } else {
      setError('No share ID provided.');
      setLoading(false);
    }
  }, [shareId]);

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  const getDayEmoji = (type) => {
    switch (type) {
      case 'exam': return <FaGraduationCap className="day-emoji" />;
      case 'holiday': return <FaUmbrellaBeach className="day-emoji" />;
      case 'event': return <FaStar className="day-emoji" />;
      default: return null;
    }
  };

  const goToApp = () => {
    // Remove share parameter and go to main app
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.location.href = url.origin + url.pathname;
  };

  if (loading) {
    return (
      <div className="shared-center-screen">
        <FaSpinner className="shared-spinner" />
        <p>Loading shared semester...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-center-screen">
        <FaExclamationTriangle className="shared-error-icon" />
        <h2>Oops!</h2>
        <p>{error}</p>
        <button className="shared-cta-btn" onClick={goToApp}>
          Go to SemesterTrack <FaArrowRight />
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="shared-center-screen">
        <FaExclamationTriangle className="shared-error-icon" />
        <h2>No Data</h2>
        <p>Could not load semester data.</p>
        <button className="shared-cta-btn" onClick={goToApp}>
          Go to SemesterTrack <FaArrowRight />
        </button>
      </div>
    );
  }

  // Parse dates
  const days = (data.days || []).map(d => ({
    ...d,
    date: toDateSafe(d.date)
  }));

  const startDate = toDateSafe(data.startDate);
  const endDate = toDateSafe(data.endDate);
  const today = new Date();

  // Calculate stats from days
  const stats = { total: days.length, working: 0, holiday: 0, event: 0, exam: 0, break: 0 };
  days.forEach(d => {
    if (d.type && stats[d.type] !== undefined) stats[d.type]++;
  });

  // Progress calculation
  let daysPassed;
  if (isAfter(today, endDate)) daysPassed = stats.total;
  else if (isBefore(today, startDate)) daysPassed = 0;
  else daysPassed = differenceInDays(today, startDate) + 1;

  const progress = stats.total > 0 ? Math.min(100, Math.round((daysPassed / stats.total) * 100)) : 0;

  let remainingDays;
  if (isAfter(today, endDate)) remainingDays = 0;
  else if (isBefore(today, startDate)) remainingDays = stats.total;
  else remainingDays = differenceInDays(endDate, today);

  const isDayPast = (d) => {
    const dayDate = new Date(d);
    dayDate.setHours(0, 0, 0, 0);
    const todayCopy = new Date();
    todayCopy.setHours(0, 0, 0, 0);
    return dayDate < todayCopy;
  };

  return (
    <div className="shared-page">
      {/* Header Bar */}
      <div className="shared-header-bar">
        <div className="shared-header-left">
          <div className="shared-logo-box">
            <FaGraduationCap />
            <FaBook className="shared-logo-book" />
          </div>
          <div>
            <h1>SemesterTrack</h1>
            <span>Shared View • Read Only</span>
          </div>
        </div>
        <button className="shared-header-btn" onClick={goToApp}>
          Create Yours <FaArrowRight />
        </button>
      </div>

      {/* Main Content */}
      <div className="shared-main">
        <div className="shared-card">
          {/* Semester Info */}
          <div className="semester-info">
            <h2>{data.semesterName || 'Unnamed Semester'}</h2>
            <p className="semester-dates">
              {format(startDate, 'MMM dd, yyyy')} — {format(endDate, 'MMM dd, yyyy')}
            </p>
            {data.sharedByName && (
              <p className="shared-by-label">
                Shared by <strong>{data.sharedByName}</strong>
              </p>
            )}
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}>
                <span className="progress-text">{progress}%</span>
              </div>
            </div>
            <p className="total-days">Day {Math.max(0, daysPassed)} of {stats.total}</p>
          </div>

          {/* Stats */}
          <div className="day-stats">
            <div className="stat-card stat-total">
              <FaCalendarDay className="stat-icon" /><h3>Total</h3><p>{stats.total}</p>
            </div>
            <div className="stat-card stat-working">
              <FaBriefcase className="stat-icon" /><h3>Working</h3><p>{stats.working}</p>
            </div>
            <div className="stat-card stat-holiday">
              <FaUmbrellaBeach className="stat-icon" /><h3>Holidays</h3><p>{stats.holiday}</p>
            </div>
            <div className="stat-card stat-event">
              <FaCalendarAlt className="stat-icon" /><h3>Events</h3><p>{stats.event}</p>
            </div>
            <div className="stat-card stat-exam">
              <FaPen className="stat-icon" /><h3>Exams</h3><p>{stats.exam}</p>
            </div>
            <div className="stat-card stat-remaining">
              <FaHourglassHalf className="stat-icon" /><h3>Remaining</h3><p>{remainingDays}</p>
            </div>
          </div>

          {/* Days Grid */}
          <div className="days-list">
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Days in Semester
            </h3>
            <div className="days-grid">
              {days.map((day, i) => {
                const d = day.date;
                const past = isDayPast(d);
                return (
                  <div
                    key={i}
                    className={`day-card ${day.type || 'blank'} ${past ? 'past-day' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    {getDayEmoji(day.type)}
                    <div className="day-name">{format(d, 'EEE')}</div>
                    <div className="day-date">{format(d, 'MMM dd')}</div>
                    <div className="day-type">{day.type ? capitalize(day.type) : 'Blank'}</div>
                    {day.description && (
                      <div className="day-description">{day.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="shared-cta-section">
          <h3>Want to track your own semester?</h3>
          <p>Create your free account and start planning.</p>
          <button className="shared-cta-btn" onClick={goToApp}>
            Get Started Free <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedView;