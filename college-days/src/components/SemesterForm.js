import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const SemesterForm = ({ semester, onSubmit, onCancel }) => {
  const { addSemester, updateSemester } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (semester) {
      setFormData({
        name: semester.name,
        startDate: semester.startDate ? new Date(semester.startDate).toISOString().split('T')[0] : '',
        endDate: semester.endDate ? new Date(semester.endDate).toISOString().split('T')[0] : ''
      });
    }
  }, [semester]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      console.log("Form already submitting, preventing double submission");
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log("Submitting semester form with data:", formData);
      
      // Validate form data before submission
      if (!formData.name || !formData.startDate || !formData.endDate) {
        throw new Error('Please fill in all required fields');
      }
      
      // Convert string dates to Date objects
      const semesterData = {
        name: formData.name.trim(),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      };
      
      console.log("Processed semester data:", semesterData);
      
      // Validate dates
      if (isNaN(semesterData.startDate.getTime()) || isNaN(semesterData.endDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (semesterData.startDate >= semesterData.endDate) {
        throw new Error('End date must be after start date');
      }
      
      if (semester) {
        await updateSemester(semester.id, semesterData);
      } else {
        console.log("Calling addSemester with:", semesterData);
        await addSemester(semesterData);
      }
      
      // Close the form immediately after successful submission
      onCancel();
    } catch (err) {
      console.error('Error submitting semester form:', err);
      setError(err.message || 'Failed to save semester. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{semester ? 'Edit Semester' : 'Create New Semester'}</h3>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Semester Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (semester ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SemesterForm;