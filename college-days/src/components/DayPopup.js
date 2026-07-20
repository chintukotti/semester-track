import React from 'react';
import { format } from 'date-fns';
import { FaEdit, FaTimes } from 'react-icons/fa';

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

const getDayTypeColor = (type) => {
  switch (type) {
    case 'working': return '#4a6fdc';
    case 'holiday': return '#28a745';
    case 'event': return '#ffc107';
    case 'exam': return '#dc3545';
    case 'break': return '#17a2b8';
    default: return '#6c757d';
  }
};

const getDayTypeEmoji = (type) => {
  switch (type) {
    case 'working': return '💼';
    case 'holiday': return '🏖️';
    case 'event': return '⭐';
    case 'exam': return '📝';
    case 'break': return '☕';
    default: return '📅';
  }
};

const DayPopup = ({ day, onEdit, onClose }) => {
  const typeColor = getDayTypeColor(day.type);

  return (
    <div className="day-popup-overlay" onClick={onClose}>
      <div className="day-popup" onClick={(e) => e.stopPropagation()}>
        {/* Thin accent line at top */}
        <div className="popup-accent" style={{ background: typeColor }} />

        <button className="popup-close" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="popup-content">
          {/* Day name + date */}
          <div className="popup-date-row">
            <span className="popup-day-label">{format(day.date, 'EEEE')}</span>
            <span className="popup-date-text">{format(day.date, 'MMM dd, yyyy')}</span>
          </div>

          {/* Type */}
          <div className="popup-type-row">
            <span className="popup-emoji">{getDayTypeEmoji(day.type)}</span>
            <span
              className="popup-type-tag"
              style={{ background: typeColor }}
            >
              {day.type ? capitalize(day.type) : 'Not Set'}
            </span>
          </div>

          {/* Description */}
          {day.description && (
            <div className="popup-desc">
              {day.description}
            </div>
          )}

          {/* Edit button */}
          <button className="popup-edit-btn" onClick={onEdit}>
            <FaEdit /> Edit Day
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayPopup;