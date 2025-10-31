import React, { useState } from 'react';
import { FaGripVertical, FaSave, FaTimes, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const SemesterOrderModal = ({ semesters, onSave, onCancel }) => {
  const [orderedSemesters, setOrderedSemesters] = useState(semesters);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (sourceIndex !== targetIndex) {
      const newSemesters = [...orderedSemesters];
      const [removed] = newSemesters.splice(sourceIndex, 1);
      newSemesters.splice(targetIndex, 0, removed);
      setOrderedSemesters(newSemesters);
    }
    
    setDraggedIndex(null);
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      const newSemesters = [...orderedSemesters];
      [newSemesters[index], newSemesters[index - 1]] = [newSemesters[index - 1], newSemesters[index]];
      setOrderedSemesters(newSemesters);
    }
  };

  const handleMoveDown = (index) => {
    if (index < orderedSemesters.length - 1) {
      const newSemesters = [...orderedSemesters];
      [newSemesters[index], newSemesters[index + 1]] = [newSemesters[index + 1], newSemesters[index]];
      setOrderedSemesters(newSemesters);
    }
  };

  const handleSave = () => {
    onSave(orderedSemesters);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content semester-order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reorder Semesters</h2>
          <button className="close-btn" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <p>Drag and drop semesters to reorder them or use the arrow buttons to move items up or down.</p>
          
          <div className="semester-list">
            {orderedSemesters.map((semester, index) => (
              <div
                key={semester.id}
                className={`sortable-semester-item ${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => setDraggedIndex(null)}
              >
                <div className="semester-item-content">
                  <div className="semester-drag-handle">
                    <FaGripVertical />
                  </div>
                  <div className="semester-info">
                    <div className="semester-name">{semester.name}</div>
                    <div className="semester-dates">
                      {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="semester-controls">
                    <button
                      className="control-btn"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="Move Up"
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      className="control-btn"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === orderedSemesters.length - 1}
                      title="Move Down"
                    >
                      <FaArrowDown />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <FaSave /> Save Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default SemesterOrderModal;