import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaTimes, FaSave, FaCalendarAlt } from 'react-icons/fa';

const DayEditForm = ({ day, onSave, onCancel, isMultiple = false, selectedCount = 1 }) => {
  const [formData, setFormData] = useState({ date: '', type: 'working', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (day) {
      let dateValue = '';
      if (day.date instanceof Date) {
        dateValue = format(day.date, 'yyyy-MM-dd');
      } else if (typeof day.date === 'string') {
        const dateObj = new Date(day.date);
        if (!isNaN(dateObj.getTime())) dateValue = format(dateObj, 'yyyy-MM-dd');
      }
      setFormData({ date: dateValue, type: day.type || 'working', description: day.description || '' });
    }
  }, [day]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onCancel();
    } catch (error) {
      console.error('Error:', error);
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { value: 'working', label: 'Working Day', emoji: '💼', color: '#4a6fdc' },
    { value: 'holiday', label: 'Holiday', emoji: '🏖️', color: '#28a745' },
    { value: 'event', label: 'Event', emoji: '⭐', color: '#ffc107' },
    { value: 'exam', label: 'Exam', emoji: '📝', color: '#dc3545' },
    { value: 'break', label: 'Break', emoji: '☕', color: '#17a2b8' }
  ];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-modal-header">
          <div className="edit-modal-title">
            <FaCalendarAlt className="edit-modal-icon" />
            <div>
              <h3>{isMultiple ? `Edit ${selectedCount} Days` : 'Edit Day'}</h3>
              {formData.date && (
                <span className="edit-modal-date">
                  {isMultiple
                    ? `${selectedCount} days selected`
                    : format(new Date(formData.date + 'T00:00:00'), 'EEEE, MMM dd, yyyy')
                  }
                </span>
              )}
            </div>
          </div>
          <button className="edit-modal-close" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="edit-modal-body">
          {/* Day Type Selection */}
          <div className="edit-field">
            <label className="edit-field-label">Day Type</label>
            <div className="type-selector">
              {typeOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`type-option ${formData.type === opt.value ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, type: opt.value })}
                  style={formData.type === opt.value ? {
                    borderColor: opt.color,
                    backgroundColor: opt.color + '12'
                  } : {}}
                >
                  <span className="type-option-emoji">{opt.emoji}</span>
                  <span className="type-option-label">{opt.label}</span>
                  {formData.type === opt.value && (
                    <span className="type-option-check" style={{ color: opt.color }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="edit-field">
            <label className="edit-field-label" htmlFor="description">
              Description <span className="optional-tag">Optional</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Add a note about this day..."
              className="edit-textarea"
            />
          </div>

          {/* Actions */}
          <div className="edit-modal-actions">
            <button type="button" className="edit-btn-cancel" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="edit-btn-save" disabled={isSubmitting}>
              <FaSave />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DayEditForm;