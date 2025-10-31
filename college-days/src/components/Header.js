import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaCalendarAlt, FaPlus, FaSignOutAlt, FaCog, FaTrash, FaEdit, FaBars, FaGripVertical, FaChevronDown, FaGraduationCap, FaBook } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import SemesterForm from './SemesterForm';
import SemesterOrderModal from './SemesterOrderModal';
import { auth } from '../firebase';

const Header = () => {
  const { user, logout, semesters, currentSemester, setCurrentSemester, addSemester, updateSemester, deleteSemester, reorderSemesters } = useApp();
  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSemesterOptions, setShowSemesterOptions] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSemesterMenu, setShowSemesterMenu] = useState(false);
  const [isEditingSemester, setIsEditingSemester] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user?.photoURL || '');
  
  // Create refs for dropdowns
  const profileDropdownRef = useRef(null);
  const semesterOptionsRef = useRef(null);
  const semesterMenuRef = useRef(null);
  const profileRef = useRef(null);
  const semesterSelectorRef = useRef(null);
  const semesterEditBtnRef = useRef(null);

  // Update photo URL when user changes
  useEffect(() => {
    if (user?.photoURL) {
      setPhotoUrl(user.photoURL);
    }
  }, [user]);

  // Close dropdowns when clicking outside - but NOT for mobile profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close semester options dropdown if clicking outside
      if (showSemesterOptions && 
          semesterOptionsRef.current && 
          !semesterOptionsRef.current.contains(event.target) && 
          !semesterEditBtnRef.current.contains(event.target)) {
        setShowSemesterOptions(false);
      }
      
      // Close semester menu if clicking outside
      if (showSemesterMenu && 
          semesterMenuRef.current && 
          !semesterMenuRef.current.contains(event.target) && 
          !semesterSelectorRef.current.contains(event.target)) {
        setShowSemesterMenu(false);
      }
      
      // Close desktop profile dropdown if clicking outside
      if (showProfileDropdown && 
          profileDropdownRef.current && 
          !profileDropdownRef.current.contains(event.target) && 
          !profileRef.current.contains(event.target) &&
          window.innerWidth > 768) { // Only for desktop
        setShowProfileDropdown(false);
      }
    };

    // Add event listener for clicks
    document.addEventListener('mousedown', handleClickOutside);
    
    // Add event listener for scroll - close all dropdowns on scroll
    const handleScroll = () => {
      setShowProfileDropdown(false);
      setShowSemesterOptions(false);
      setShowSemesterMenu(false);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showProfileDropdown, showSemesterOptions, showSemesterMenu]);

  const handleSemesterSelect = (semester) => {
    setCurrentSemester(semester);
    setShowSemesterMenu(false);
  };

  const handleCreateSemester = () => {
    if (isCreating) return; // Prevent multiple clicks
    
    setIsEditingSemester(false);
    setShowSemesterForm(true);
    setShowSemesterOptions(false);
    setIsCreating(true);
  };

  const handleCreateSemesterSubmit = async (semesterData) => {
    try {
      console.log("Creating semester with data:", semesterData);
      
      // Check if semester data is valid
      if (!semesterData || typeof semesterData !== 'object') {
        console.error("Invalid semester data:", semesterData);
        return; // Return early without throwing an error
      }
      
      // Pass the data directly to addSemester
      const result = await addSemester(semesterData);
      console.log("Semester created successfully:", result);
      
      // Close the form immediately after successful submission
      setShowSemesterForm(false);
      setIsCreating(false);
    } catch (err) {
      console.error('Error creating semester:', err);
      // Don't show alert here, let the form handle the error display
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSemester = () => {
    setIsEditingSemester(true);
    setShowSemesterForm(true);
    setShowSemesterOptions(false);
  };

  const handleUpdateSemester = async (semesterData) => {
    try {
      await updateSemester(currentSemester.id, semesterData);
      // Close the form immediately after successful submission
      setShowSemesterForm(false);
    } catch (err) {
      console.error('Error updating semester:', err);
      // Don't show alert here, let the form handle the error display
    }
  };

  const handleDeleteSemester = async () => {
    if (window.confirm(`Are you sure you want to delete the "${currentSemester.name}" semester? This will also delete all associated days.`)) {
      try {
        await deleteSemester(currentSemester.id);
        setShowSemesterOptions(false);
      } catch (err) {
        console.error('Error deleting semester:', err);
        alert('Failed to delete semester. Please try again.');
      }
    }
  };

  const handleReorderSemesters = async (updatedSemesters) => {
    try {
      // Close the modal first
      setShowOrderModal(false);
      
      // Add a small delay before reordering to ensure the modal is fully closed
      setTimeout(async () => {
        try {
          await reorderSemesters(updatedSemesters);
        } catch (err) {
          console.error('Error reordering semesters:', err);
          alert('Failed to reorder semesters. Please try again.');
        }
      }, 300);
    } catch (err) {
      console.error('Error in handleReorderSemesters:', err);
      alert('Failed to reorder semesters. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      // Close dropdown first
      setShowProfileDropdown(false);
      
      // Sign out from Firebase
      await auth.signOut();
      
      // Call context logout function
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const toggleProfileDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProfileDropdown(!showProfileDropdown);
    // Close other dropdowns when opening this one
    if (!showProfileDropdown) {
      setShowSemesterOptions(false);
      setShowSemesterMenu(false);
    }
  };

  const toggleSemesterOptions = (e) => {
    e.stopPropagation();
    setShowSemesterOptions(!showSemesterOptions);
    // Close other dropdowns when opening this one
    if (!showSemesterOptions) {
      setShowProfileDropdown(false);
      setShowSemesterMenu(false);
    }
  };

  const toggleSemesterMenu = (e) => {
    e.stopPropagation();
    setShowSemesterMenu(!showSemesterMenu);
    // Close other dropdowns when opening this one
    if (!showSemesterMenu) {
      setShowProfileDropdown(false);
      setShowSemesterOptions(false);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo-container">
            <div className="logo">
              <FaGraduationCap className="logo-icon" />
              <FaBook className="logo-icon book-icon" />
            </div>
            <div className="app-name">
              <h1>SemesterTrack</h1>
              <p>Academic Semester Planner</p>
            </div>
          </div>
          
          {/* Profile moved inside header-left for mobile */}
          <div className="user-profile mobile-profile">
            {photoUrl ? (
              <div className="profile-container">
                <img 
                  ref={profileRef}
                  src={photoUrl} 
                  alt={user?.name || 'User'} 
                  className="profile-photo"
                  onClick={toggleProfileDropdown}
                />
                {showProfileDropdown && (
                  <div className="profile-dropdown mobile-logout-dropdown" ref={profileDropdownRef}>
                    <button 
                      className="mobile-logout-btn" 
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="profile-icon" onClick={handleLogout} title="Logout">
                <FaUserCircle size={24} />
              </div>
            )}
          </div>
        </div>
        
        <div className="header-center">
          <div className="semester-container">
            <div className="semester-selector-wrapper">
              <FaCalendarAlt className="calendar-icon" />
              <div 
                ref={semesterSelectorRef}
                className="current-semester" 
                onClick={toggleSemesterMenu}
              >
                <span className="semester-name">
                  {currentSemester ? currentSemester.name : 'Select a semester'}
                </span>
                <FaChevronDown className={`dropdown-arrow ${showSemesterMenu ? 'open' : ''}`} />
              </div>
              <button 
                className="icon-btn add-btn"
                onClick={handleCreateSemester}
                title="Add New Semester"
                disabled={isCreating}
              >
                <FaPlus />
              </button>
              {currentSemester && (
                <button 
                  ref={semesterEditBtnRef}
                  className="icon-btn edit-btn"
                  onClick={toggleSemesterOptions}
                  title="Edit Semester"
                >
                  <FaEdit />
                </button>
              )}
              {showSemesterOptions && (
                <div className="semester-dropdown" ref={semesterOptionsRef}>
                  <button className="dropdown-item" onClick={handleEditSemester}>
                    <FaCog /> Edit
                  </button>
                  <button className="dropdown-item delete" onClick={handleDeleteSemester}>
                    <FaTrash /> Delete
                  </button>
                </div>
              )}
              <button 
                className="icon-btn order-btn"
                onClick={() => setShowOrderModal(true)}
                title="Reorder Semesters"
              >
                <FaBars />
              </button>
              
              {/* Semester Menu */}
              {showSemesterMenu && (
                <div className="semester-menu" ref={semesterMenuRef}>
                  <div className="menu-header">
                    <h3>Select Semester</h3>
                  </div>
                  <div className="menu-items">
                    {semesters.map(semester => (
                      <div 
                        key={semester.id} 
                        className={`menu-item ${currentSemester?.id === semester.id ? 'active' : ''}`}
                        onClick={() => handleSemesterSelect(semester)}
                      >
                        <div className="menu-item-name">{semester.name}</div>
                        <div className="menu-item-dates">
                          {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Desktop profile - hidden on mobile */}
        <div className="header-right desktop-profile">
          <div className="user-profile">
            {photoUrl ? (
              <div className="profile-container">
                <img 
                  src={photoUrl} 
                  alt={user?.name || 'User'} 
                  className="profile-photo"
                  onClick={toggleProfileDropdown}
                />
                {showProfileDropdown && (
                  <div className="profile-dropdown" ref={profileDropdownRef}>
                    <div className="profile-info">
                      <img src={photoUrl} alt={user?.name || 'User'} className="dropdown-photo" />
                      <div className="user-details">
                        <div className="user-name">{user?.name || 'User'}</div>
                        <div className="user-email">{user?.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="logout-btn" 
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="profile-icon" onClick={handleLogout} title="Logout">
                <FaUserCircle size={24} />
              </div>
            )}
          </div>
        </div>
      </div>
      {showSemesterForm && (
        <SemesterForm 
          semester={isEditingSemester ? currentSemester : null}
          onSubmit={isEditingSemester ? handleUpdateSemester : handleCreateSemesterSubmit} 
          onCancel={() => {
            setShowSemesterForm(false);
            setIsCreating(false);
          }} 
        />
      )}
      {showOrderModal && (
        <SemesterOrderModal 
          semesters={semesters}
          onSave={handleReorderSemesters}
          onCancel={() => setShowOrderModal(false)}
        />
      )}
    </header>
  );
};

export default Header;