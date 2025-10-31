import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const SemesterSetup = () => {
  const { semesters, currentSemester, addSemester, setCurrentSemester } = useApp();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [newSemester, setNewSemester] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (semesters.length > 0 && !currentSemester) {
      setCurrentSemester(semesters[0]);
      setSelectedSemester(semesters[0].id);
    } else if (currentSemester) {
      setSelectedSemester(currentSemester.id);
    }
  }, [semesters, currentSemester, setCurrentSemester]);

  const handleSemesterChange = (e) => {
    const semesterId = e.target.value;
    setSelectedSemester(semesterId);
    const semester = semesters.find(s => s.id === semesterId);
    if (semester) {
      setCurrentSemester(semester);
    }
  };

  const handleInputChange = (e) => {
    setNewSemester({
      ...newSemester,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const createdSemester = addSemester(newSemester);
    setSelectedSemester(createdSemester.id);
    setCurrentSemester(createdSemester);
    setNewSemester({ name: '', startDate: '', endDate: '' });
    setShowForm(false);
  };

  return (
    <div className="semester-setup">
      <div className="semester-selector">
        <label htmlFor="semester-select">Select Semester:</label>
        <select 
          id="semester-select" 
          value={selectedSemester} 
          onChange={handleSemesterChange}
        >
          {semesters.map(semester => (
            <option key={semester.id} value={semester.id}>
              {semester.name}
            </option>
          ))}
        </select>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Semester'}
        </button>
      </div>

      {showForm && (
        <form className="semester-form" onSubmit={handleSubmit}>
          <h3>Create New Semester</h3>
          <div className="form-group">
            <label htmlFor="semester-name">Semester Name:</label>
            <input
              type="text"
              id="semester-name"
              name="name"
              value={newSemester.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="start-date">Start Date:</label>
            <input
              type="date"
              id="start-date"
              name="startDate"
              value={newSemester.startDate}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="end-date">End Date:</label>
            <input
              type="date"
              id="end-date"
              name="endDate"
              value={newSemester.endDate}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit">Create Semester</button>
        </form>
      )}
    </div>
  );
};

export default SemesterSetup;