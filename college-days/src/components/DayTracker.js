import React, { useState, useEffect } from 'react';
import { format, isSunday, differenceInDays, isAfter, isBefore, isToday } from 'date-fns';
import { useApp } from '../context/AppContext';
import DayEditForm from './DayEditForm';
import DayPopup from './DayPopup';
import { FaBriefcase, FaUmbrellaBeach, FaCalendarAlt, FaPen, FaCalendarDay, FaHourglassHalf, FaGraduationCap, FaCalendarCheck, FaStar } from 'react-icons/fa';

const DayTracker = () => {
  const { currentSemester, addOrUpdateDay, getDaysForCurrentSemester, getSemesterStats } = useApp();
  const [editingDay, setEditingDay] = useState(null);
  const [popupDay, setPopupDay] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const handleDayClick = (day) => {
    if (isSelectMode) {
      // Toggle selection
      const dayId = format(day.date, 'yyyy-MM-dd');
      if (selectedDays.includes(dayId)) {
        setSelectedDays(selectedDays.filter(id => id !== dayId));
      } else {
        setSelectedDays([...selectedDays, dayId]);
      }
    } else {
      // Show popup for the day
      setPopupDay(day);
    }
  };

  const handleSaveDay = (dayData) => {
    if (currentSemester) {
      addOrUpdateDay({
        semesterId: currentSemester.id,
        date: dayData.date,
        type: dayData.type,
        description: dayData.description
      });
      setEditingDay(null);
    }
  };

  const handleSaveMultipleDays = (dayData) => {
    if (currentSemester) {
      selectedDays.forEach(date => {
        addOrUpdateDay({
          semesterId: currentSemester.id,
          date,
          type: dayData.type,
          description: dayData.description
        });
      });
      setSelectedDays([]);
      setIsSelectMode(false);
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedDays([]);
  };

  const clearSelection = () => {
    setSelectedDays([]);
  };

  const handleEditSelected = () => {
    if (selectedDays.length > 0) {
      // Get the first selected day to populate the form
      const firstSelectedDay = getDaysForCurrentSemester().find(
        day => format(day.date, 'yyyy-MM-dd') === selectedDays[0]
      );
      
      if (firstSelectedDay) {
        setEditingDay({
          date: firstSelectedDay.date,
          type: firstSelectedDay.type,
          description: firstSelectedDay.description,
          isMultiple: true
        });
      }
    }
  };

  const handleEditFromPopup = (day) => {
    setPopupDay(null);
    setEditingDay({
      date: day.date,
      type: day.type,
      description: day.description,
      isMultiple: false
    });
  };

  // Function to capitalize the first letter of a string
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Function to get the appropriate emoji for a day type
  const getDayEmoji = (dayType) => {
    switch (dayType) {
      case 'exam':
        return <FaGraduationCap className="day-emoji" />;
      case 'holiday':
        return <FaUmbrellaBeach className="day-emoji" />;
      case 'event':
        return <FaStar className="day-emoji" />;
      default:
        return null;
    }
  };

  // Function to check if a day is before today
  const isDayBeforeToday = (dayDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
    return isBefore(dayDate, today);
  };

  if (!currentSemester) return <div>Select a semester to get started</div>;

  const days = getDaysForCurrentSemester();
  const stats = getSemesterStats();
  
  // Calculate days within the semester
  const today = new Date();
  const startDate = new Date(currentSemester.startDate);
  const endDate = new Date(currentSemester.endDate);
  
  // Calculate days passed within the semester
  let daysPassed;
  if (isAfter(today, endDate)) {
    // If today is after the semester end, show total days
    daysPassed = stats.total;
  } else if (isBefore(today, startDate)) {
    // If today is before the semester start, show 0
    daysPassed = 0;
  } else {
    // If today is within the semester, calculate days from start to today
    daysPassed = differenceInDays(today, startDate) + 1;
  }
  
  // Calculate progress based on days within the semester
  const progress = stats.total > 0 ? Math.min(100, Math.round((daysPassed / stats.total) * 100)) : 0;
  
  // Calculate remaining days
  let remainingDays;
  if (isAfter(today, endDate)) {
    // If today is after the semester end, no remaining days
    remainingDays = 0;
  } else if (isBefore(today, startDate)) {
    // If today is before the semester start, all days are remaining
    remainingDays = stats.total;
  } else {
    // If today is within the semester, calculate days from today to end
    remainingDays = differenceInDays(endDate, today);
  }

  // Get today's date
  const todayFormatted = format(today, 'yyyy-MM-dd');

  return (
    <div className="day-tracker">
      <div className="semester-info">
        <h2>{currentSemester.name}</h2>
        <p className="semester-dates">
          {format(new Date(currentSemester.startDate), 'MMM dd, yyyy')} - {' '}
          {format(new Date(currentSemester.endDate), 'MMM dd, yyyy')}
        </p>
        <p className="today-date">
          Today: {format(today, 'EEEE, MMMM dd, yyyy')}
        </p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <span>{progress}%</span>
        </div>
        <p className="total-days">Day {daysPassed} of {stats.total} Days</p>
      </div>

      <div className="day-stats">
        <div className="stat-card">
          <FaCalendarDay className="stat-icon total" />
          <h3>Total Days</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card">
          <FaBriefcase className="stat-icon working" />
          <h3>Working Days</h3>
          <p>{stats.working}</p>
        </div>
        <div className="stat-card">
          <FaUmbrellaBeach className="stat-icon holiday" />
          <h3>Holidays</h3>
          <p>{stats.holiday}</p>
        </div>
        <div className="stat-card">
          <FaCalendarAlt className="stat-icon event" />
          <h3>Events</h3>
          <p>{stats.event}</p>
        </div>
        <div className="stat-card">
          <FaPen className="stat-icon exam" />
          <h3>Exams</h3>
          <p>{stats.exam}</p>
        </div>
        <div className="stat-card">
          <FaHourglassHalf className="stat-icon remaining" />
          <h3>Remaining Days</h3>
          <p>{remainingDays}</p>
        </div>
      </div>

      <div className="days-list">
        <div className="days-header">
          <h3>Days in Semester</h3>
          <div className="days-actions">
            <button 
              className={`select-mode-btn ${isSelectMode ? 'active' : ''}`}
              onClick={toggleSelectMode}
            >
              {isSelectMode ? 'Exit Selection' : 'Select Multiple Days'}
            </button>
            {isSelectMode && selectedDays.length > 0 && (
              <>
                <span className="selected-count">{selectedDays.length} days selected</span>
                <button 
                  className="edit-selected-btn"
                  onClick={handleEditSelected}
                >
                  Edit Selected
                </button>
                <button 
                  className="clear-selection-btn"
                  onClick={clearSelection}
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
        <div className="days-grid">
          {days.map((day, index) => {
            const dayId = format(day.date, 'yyyy-MM-dd');
            const isSelected = selectedDays.includes(dayId);
            const isBeforeToday = isDayBeforeToday(day.date);
            
            return (
              <div 
                key={index} 
                className={`day-card ${day.type || 'blank'} ${dayId === todayFormatted ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isBeforeToday ? 'past-day' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                {isSelectMode && (
                  <div className="selection-indicator">
                    {isSelected && <span>✓</span>}
                  </div>
                )}
                {getDayEmoji(day.type)}
                <div className="day-name">{format(day.date, 'EEE')}</div>
                <div className="day-date">{format(day.date, 'MMM dd')}</div>
                <div className="day-type">{day.type ? capitalize(day.type) : 'Blank'}</div>
                {day.description && <div className="day-description">{day.description}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {popupDay && (
        <DayPopup 
          day={popupDay} 
          onEdit={() => handleEditFromPopup(popupDay)} 
          onClose={() => setPopupDay(null)} 
        />
      )}

      {editingDay && (
        <DayEditForm 
          day={editingDay} 
          onSave={editingDay.isMultiple ? handleSaveMultipleDays : handleSaveDay} 
          onCancel={() => {
            setEditingDay(null);
            if (editingDay.isMultiple) {
              setSelectedDays([]);
              setIsSelectMode(false);
            }
          }} 
          isMultiple={editingDay.isMultiple || false}
          selectedCount={selectedDays.length}
        />
      )}
    </div>
  );
};

export default DayTracker;