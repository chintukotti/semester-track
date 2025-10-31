import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const DayEditForm = ({ day, onSave, onCancel, isMultiple = false, selectedCount = 1 }) => {
  const [formData, setFormData] = useState({
    date: '',
    type: 'working',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (day) {
      // Make sure we're working with a valid Date object
      let dateValue = '';
      
      if (day.date instanceof Date) {
        dateValue = format(day.date, 'yyyy-MM-dd');
      } else if (typeof day.date === 'string') {
        // If it's a string, try to create a Date object
        const dateObj = new Date(day.date);
        if (!isNaN(dateObj.getTime())) {
          dateValue = format(dateObj, 'yyyy-MM-dd');
        }
      }
      
      setFormData({
        date: dateValue,
        type: day.type || 'working',
        description: day.description || ''
      });
    }
  }, [day]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      // Close the form after successful submission
      onCancel();
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{isMultiple ? `Edit ${selectedCount} Days` : 'Edit Day'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">
              {isMultiple ? 'First Selected Date:' : 'Date:'}
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              disabled
            />
            {isMultiple && (
              <p className="multi-day-info">
                This edit will apply to all {selectedCount} selected days
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="type">Day Type:</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="working">Working Day</option>
              <option value="holiday">Holiday</option>
              <option value="event">Event</option>
              <option value="exam">Exam</option>
              <option value="break">Break</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DayEditForm;