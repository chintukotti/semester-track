import React from 'react';
import { format } from 'date-fns';
import { FaEdit, FaTimes } from 'react-icons/fa';

// Function to capitalize the first letter of a string
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const DayPopup = ({ day, onEdit, onClose }) => {
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

  return (
    <div className="day-popup-overlay" onClick={onClose}>
      <div className="day-popup" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>
          <FaTimes />
        </button>
        <div className="popup-header">
          <div className="popup-date">{format(day.date, 'MMM dd, yyyy')}</div>
          <div 
            className="popup-type" 
            style={{ backgroundColor: getDayTypeColor(day.type) }}
          >
            {day.type ? capitalize(day.type) : 'Blank'}
          </div>
        </div>
        {day.description && (
          <div className="popup-description">
            {day.description}
          </div>
        )}
        <button className="popup-edit-btn" onClick={onEdit}>
          <FaEdit /> Edit Day
        </button>
      </div>
    </div>
  );
};

export default DayPopup;