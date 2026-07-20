import React, { useState, useRef, useCallback } from 'react';
import { format, differenceInDays, isAfter, isBefore, isToday as isTodayFn } from 'date-fns';
import { useApp } from '../context/AppContext';
import DayEditForm from './DayEditForm';
import DayPopup from './DayPopup';
import {
  FaBriefcase, FaUmbrellaBeach, FaCalendarAlt, FaPen,
  FaCalendarDay, FaHourglassHalf, FaGraduationCap, FaStar,
  FaEdit, FaTimes, FaCheckSquare
} from 'react-icons/fa';

const DayTracker = () => {
  const { currentSemester, addOrUpdateDay, getDaysForCurrentSemester, getSemesterStats } = useApp();
  const [editingDay, setEditingDay] = useState(null);
  const [popupDay, setPopupDay] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e, day) => {
    longPressTriggered.current = false;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      if (!isSelectMode) setIsSelectMode(true);
      const dayId = format(day.date, 'yyyy-MM-dd');
      setSelectedDays(prev => prev.includes(dayId) ? prev : [...prev, dayId]);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  }, [isSelectMode]);

  const handleTouchMove = useCallback((e) => {
    if (longPressTimer.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleDayClick = (day) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (isSelectMode) {
      const dayId = format(day.date, 'yyyy-MM-dd');
      if (selectedDays.includes(dayId)) {
        const newSelected = selectedDays.filter(id => id !== dayId);
        setSelectedDays(newSelected);
        if (newSelected.length === 0) setIsSelectMode(false);
      } else {
        setSelectedDays([...selectedDays, dayId]);
      }
    } else {
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
    setIsSelectMode(false);
  };

  const handleEditSelected = () => {
    if (selectedDays.length > 0) {
      const firstDay = getDaysForCurrentSemester().find(
        d => format(d.date, 'yyyy-MM-dd') === selectedDays[0]
      );
      if (firstDay) {
        setEditingDay({
          date: firstDay.date,
          type: firstDay.type,
          description: firstDay.description,
          isMultiple: true
        });
      }
    }
  };

  const handleEditFromPopup = (day) => {
    setPopupDay(null);
    setEditingDay({ date: day.date, type: day.type, description: day.description, isMultiple: false });
  };

  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const getDayEmoji = (type) => {
    switch (type) {
      case 'exam': return <FaGraduationCap className="day-emoji" />;
      case 'holiday': return <FaUmbrellaBeach className="day-emoji" />;
      case 'event': return <FaStar className="day-emoji" />;
      default: return null;
    }
  };

  const isDayBeforeToday = (dayDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(dayDate, today);
  };

  if (!currentSemester) {
    return (
      <div className="empty-state">
        <FaCalendarAlt className="empty-icon" />
        <h2>No Semester Selected</h2>
        <p>Create or select a semester to get started</p>
      </div>
    );
  }

  const days = getDaysForCurrentSemester();
  const stats = getSemesterStats();
  const today = new Date();
  const startDate = new Date(currentSemester.startDate);
  const endDate = new Date(currentSemester.endDate);

  let daysPassed;
  if (isAfter(today, endDate)) daysPassed = stats.total;
  else if (isBefore(today, startDate)) daysPassed = 0;
  else daysPassed = differenceInDays(today, startDate) + 1;

  const progress = stats.total > 0 ? Math.min(100, Math.round((daysPassed / stats.total) * 100)) : 0;

  let remainingDays;
  if (isAfter(today, endDate)) remainingDays = 0;
  else if (isBefore(today, startDate)) remainingDays = stats.total;
  else remainingDays = differenceInDays(endDate, today);

  const todayFormatted = format(today, 'yyyy-MM-dd');

  return (
    <div className="day-tracker">
      <div className="semester-info">
        <h2>{currentSemester.name}</h2>
        <p className="semester-dates">
          {format(startDate, 'MMM dd, yyyy')} — {format(endDate, 'MMM dd, yyyy')}
        </p>
        <p className="today-date">Today: {format(today, 'EEEE, MMMM dd, yyyy')}</p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            <span className="progress-text">{progress}%</span>
          </div>
        </div>
        <p className="total-days">Day {daysPassed} of {stats.total}</p>
      </div>

      <div className="day-stats">
        <div className="stat-card stat-total">
          <FaCalendarDay className="stat-icon" />
          <h3>Total</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card stat-working">
          <FaBriefcase className="stat-icon" />
          <h3>Working</h3>
          <p>{stats.working}</p>
        </div>
        <div className="stat-card stat-holiday">
          <FaUmbrellaBeach className="stat-icon" />
          <h3>Holidays</h3>
          <p>{stats.holiday}</p>
        </div>
        <div className="stat-card stat-event">
          <FaCalendarAlt className="stat-icon" />
          <h3>Events</h3>
          <p>{stats.event}</p>
        </div>
        <div className="stat-card stat-exam">
          <FaPen className="stat-icon" />
          <h3>Exams</h3>
          <p>{stats.exam}</p>
        </div>
        <div className="stat-card stat-remaining">
          <FaHourglassHalf className="stat-icon" />
          <h3>Remaining</h3>
          <p>{remainingDays}</p>
        </div>
      </div>

      <div className="days-list">
        <div className="days-header">
          <h3>Days in Semester</h3>
          <div className="days-actions desktop-only">
            <button
              className={`select-mode-btn ${isSelectMode ? 'active' : ''}`}
              onClick={toggleSelectMode}
            >
              {isSelectMode ? 'Exit Selection' : 'Select Multiple'}
            </button>
            {isSelectMode && selectedDays.length > 0 && (
              <>
                <span className="selected-count">{selectedDays.length} selected</span>
                <button className="edit-selected-btn" onClick={handleEditSelected}>Edit Selected</button>
                <button className="clear-selection-btn" onClick={clearSelection}>Clear</button>
              </>
            )}
          </div>
          <p className="mobile-hint mobile-only">💡 Long press a day to select multiple</p>
        </div>

        <div className="days-grid">
          {days.map((day, index) => {
            const dayId = format(day.date, 'yyyy-MM-dd');
            const isSelected = selectedDays.includes(dayId);
            const isBeforeToday = isDayBeforeToday(day.date);
            const isCurrentDay = dayId === todayFormatted;

            return (
              <div
                key={index}
                className={`day-card ${day.type || 'blank'} ${isCurrentDay ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isBeforeToday ? 'past-day' : ''}`}
                onClick={() => handleDayClick(day)}
                onTouchStart={(e) => handleTouchStart(e, day)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => e.preventDefault()}
              >
                {isSelectMode && (
                  <div className={`selection-checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <span>✓</span>}
                  </div>
                )}
                {getDayEmoji(day.type)}
                {isCurrentDay && <div className="today-badge">TODAY</div>}
                <div className="day-name">{format(day.date, 'EEE')}</div>
                <div className="day-date">{format(day.date, 'MMM dd')}</div>
                <div className="day-type">{day.type ? capitalize(day.type) : 'Blank'}</div>
                {day.description && <div className="day-description">{day.description}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {isSelectMode && selectedDays.length > 0 && (
        <div className="floating-toolbar">
          <div className="floating-toolbar-content">
            <span className="toolbar-count">
              <FaCheckSquare /> {selectedDays.length} selected
            </span>
            <div className="toolbar-actions">
              <button className="toolbar-btn toolbar-edit" onClick={handleEditSelected}>
                <FaEdit /> Edit
              </button>
              <button className="toolbar-btn toolbar-clear" onClick={clearSelection}>
                <FaTimes /> Clear
              </button>
            </div>
          </div>
        </div>
      )}

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