import React, { useState } from 'react';
import { FaGripVertical, FaSave, FaTimes, FaArrowUp, FaArrowDown, FaSort } from 'react-icons/fa';

const SemesterOrderModal = ({ semesters, onSave, onCancel }) => {
  const [orderedSemesters, setOrderedSemesters] = useState(semesters);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex !== targetIndex) {
      const newList = [...orderedSemesters];
      const [removed] = newList.splice(sourceIndex, 1);
      newList.splice(targetIndex, 0, removed);
      setOrderedSemesters(newList);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      const newList = [...orderedSemesters];
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
      setOrderedSemesters(newList);
    }
  };

  const handleMoveDown = (index) => {
    if (index < orderedSemesters.length - 1) {
      const newList = [...orderedSemesters];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      setOrderedSemesters(newList);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="reorder-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="reorder-header">
          <div className="reorder-title">
            <FaSort className="reorder-title-icon" />
            <div>
              <h2>Reorder Semesters</h2>
              <p>Drag or use arrows to reorder</p>
            </div>
          </div>
          <button className="reorder-close" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>

        {/* List */}
        <div className="reorder-body">
          <div className="reorder-list">
            {orderedSemesters.map((semester, index) => (
              <div
                key={semester.id}
                className={`reorder-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                {/* Position number */}
                <div className="reorder-position">{index + 1}</div>

                {/* Drag handle */}
                <div className="reorder-handle">
                  <FaGripVertical />
                </div>

                {/* Semester info */}
                <div className="reorder-info">
                  <div className="reorder-name">{semester.name}</div>
                  <div className="reorder-dates">
                    {new Date(semester.startDate).toLocaleDateString()} —{' '}
                    {new Date(semester.endDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Arrow buttons */}
                <div className="reorder-arrows">
                  <button
                    className="reorder-arrow-btn"
                    onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                    disabled={index === 0}
                    title="Move Up"
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    className="reorder-arrow-btn"
                    onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                    disabled={index === orderedSemesters.length - 1}
                    title="Move Down"
                  >
                    <FaArrowDown />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="reorder-footer">
          <button className="reorder-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="reorder-btn-save" onClick={() => onSave(orderedSemesters)}>
            <FaSave /> Save Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default SemesterOrderModal;