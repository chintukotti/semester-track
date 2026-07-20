import React, { useState, useEffect, useRef } from 'react';
import {
  FaUserCircle, FaCalendarAlt, FaPlus, FaSignOutAlt,
  FaCog, FaTrash, FaEdit, FaBars, FaChevronDown,
  FaGraduationCap, FaBook, FaSun, FaMoon,
  FaShareAlt, FaFilePdf, FaCopy, FaCheck, FaTimes, FaLink
} from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import SemesterForm from './SemesterForm';
import SemesterOrderModal from './SemesterOrderModal';
import { exportSemesterPdf } from '../utils/exportPdf';
import { auth } from '../firebase';

const ProfileAvatar = ({ src, alt, className, onClick, innerRef }) => {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setImgError(false); setLoaded(false); }, [src]);
  if (!src || imgError) return <div className={`profile-avatar-fallback ${className || ''}`} onClick={onClick} ref={innerRef}><FaUserCircle size={36} /></div>;
  return (
    <div className="profile-avatar-wrapper" ref={innerRef}>
      {!loaded && <div className={`profile-avatar-fallback ${className || ''}`}><FaUserCircle size={36} /></div>}
      <img src={src} alt={alt} className={`${className || ''} ${loaded ? '' : 'hidden-img'}`} referrerPolicy="no-referrer" crossOrigin="anonymous" onLoad={() => setLoaded(true)} onError={() => setImgError(true)} onClick={onClick} />
    </div>
  );
};

const Header = () => {
  const {
    user, logout, semesters, currentSemester, setCurrentSemester,
    addSemester, updateSemester, deleteSemester, reorderSemesters,
    theme, toggleTheme, shareSemester,
    getDaysForCurrentSemester, getSemesterStats
  } = useApp();

  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSemesterOptions, setShowSemesterOptions] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSemesterMenu, setShowSemesterMenu] = useState(false);
  const [isEditingSemester, setIsEditingSemester] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const photoUrl = user?.photoURL || '';

  const profileDropdownRef = useRef(null);
  const semesterOptionsRef = useRef(null);
  const semesterMenuRef = useRef(null);
  const profileRef = useRef(null);
  const semesterSelectorRef = useRef(null);
  const semesterEditBtnRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSemesterOptions && semesterOptionsRef.current && !semesterOptionsRef.current.contains(e.target) && semesterEditBtnRef.current && !semesterEditBtnRef.current.contains(e.target)) setShowSemesterOptions(false);
      if (showSemesterMenu && semesterMenuRef.current && !semesterMenuRef.current.contains(e.target) && semesterSelectorRef.current && !semesterSelectorRef.current.contains(e.target)) setShowSemesterMenu(false);
      if (showProfileDropdown && profileDropdownRef.current && !profileDropdownRef.current.contains(e.target) && profileRef.current && !profileRef.current.contains(e.target) && window.innerWidth > 768) setShowProfileDropdown(false);
    };
    const handleScroll = () => { setShowProfileDropdown(false); setShowSemesterOptions(false); setShowSemesterMenu(false); };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    return () => { document.removeEventListener('mousedown', handleClickOutside); window.removeEventListener('scroll', handleScroll); };
  }, [showProfileDropdown, showSemesterOptions, showSemesterMenu]);

  // Share handler
  const handleShare = async () => {
    if (!currentSemester) return;
    setShowProfileDropdown(false);
    setShowShareModal(true);
    setIsSharing(true);
    setCopied(false);
    try {
      const link = await shareSemester();
      setShareLink(link);
    } catch (err) {
      console.error('Share error:', err);
      setShareLink('');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Export handler
  const handleExport = () => {
    if (!currentSemester) return;
    setShowProfileDropdown(false);
    try {
      const days = getDaysForCurrentSemester();
      const stats = getSemesterStats();
      exportSemesterPdf(currentSemester, days, stats);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleSemesterSelect = (s) => { setCurrentSemester(s); setShowSemesterMenu(false); };

  const handleCreateSemester = () => {
    if (isCreating) return;
    setIsEditingSemester(false); setShowSemesterForm(true); setShowSemesterOptions(false); setIsCreating(true);
  };

  const handleCreateSemesterSubmit = async (data) => {
    try { if (!data || typeof data !== 'object') return; await addSemester(data); setShowSemesterForm(false); setIsCreating(false); }
    catch (err) { console.error('Error:', err); } finally { setIsCreating(false); }
  };

  const handleEditSemester = () => { setIsEditingSemester(true); setShowSemesterForm(true); setShowSemesterOptions(false); };

  const handleUpdateSemester = async (data) => {
    try { await updateSemester(currentSemester.id, data); setShowSemesterForm(false); } catch (err) { console.error('Error:', err); }
  };

  const handleDeleteSemester = async () => {
    if (window.confirm(`Delete "${currentSemester.name}"?`)) {
      try { await deleteSemester(currentSemester.id); setShowSemesterOptions(false); } catch (err) { alert('Failed to delete.'); }
    }
  };

  const handleReorderSemesters = async (list) => {
    setShowOrderModal(false);
    setTimeout(async () => { try { await reorderSemesters(list); } catch {} }, 300);
  };

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    try { await auth.signOut(); await logout(); } catch {}
  };

  const toggleProfileDropdown = (e) => {
    e.preventDefault(); e.stopPropagation();
    setShowProfileDropdown(!showProfileDropdown);
    if (!showProfileDropdown) { setShowSemesterOptions(false); setShowSemesterMenu(false); }
  };

  const toggleSemesterOptions = (e) => {
    e.stopPropagation(); setShowSemesterOptions(!showSemesterOptions);
    if (!showSemesterOptions) { setShowProfileDropdown(false); setShowSemesterMenu(false); }
  };

  const toggleSemesterMenu = (e) => {
    e.stopPropagation(); setShowSemesterMenu(!showSemesterMenu);
    if (!showSemesterMenu) { setShowProfileDropdown(false); setShowSemesterOptions(false); }
  };

  const hasCurrentSemester = !!currentSemester;

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo-container">
            <div className="logo"><FaGraduationCap className="logo-icon" /><FaBook className="logo-icon book-icon" /></div>
            <div className="app-name"><h1>SemesterTrack</h1><p>Academic Semester Planner</p></div>
          </div>

          {/* Mobile: theme + profile */}
          <div className="mobile-header-actions">
            <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}>
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
            <div className="user-profile mobile-profile">
              <div className="profile-container">
                <ProfileAvatar src={photoUrl} alt={user?.name || 'User'} className="profile-photo" onClick={toggleProfileDropdown} innerRef={profileRef} />
                {showProfileDropdown && (
                  <div className="profile-dropdown mobile-action-dropdown" ref={profileDropdownRef}>
                    <button className="profile-action-item" onClick={handleShare} disabled={!hasCurrentSemester}>
                      <FaShareAlt /> Share Semester
                    </button>
                    <button className="profile-action-item" onClick={handleExport} disabled={!hasCurrentSemester}>
                      <FaFilePdf /> Export PDF
                    </button>
                    <div className="dropdown-divider" />
                    <button className="profile-action-item danger" onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="semester-container">
            <div className="semester-selector-wrapper">
              <FaCalendarAlt className="calendar-icon" />
              <div ref={semesterSelectorRef} className="current-semester" onClick={toggleSemesterMenu}>
                <span className="semester-label">{currentSemester ? currentSemester.name : 'Select a semester'}</span>
                <FaChevronDown className={`dropdown-arrow ${showSemesterMenu ? 'open' : ''}`} />
              </div>
              <button className="icon-btn add-btn" onClick={handleCreateSemester} disabled={isCreating}><FaPlus /></button>
              {currentSemester && <button ref={semesterEditBtnRef} className="icon-btn edit-btn" onClick={toggleSemesterOptions}><FaEdit /></button>}
              {showSemesterOptions && (
                <div className="semester-dropdown" ref={semesterOptionsRef}>
                  <button className="dropdown-item" onClick={handleEditSemester}><FaCog /> Edit</button>
                  <button className="dropdown-item delete" onClick={handleDeleteSemester}><FaTrash /> Delete</button>
                </div>
              )}
              <button className="icon-btn order-btn" onClick={() => setShowOrderModal(true)}><FaBars /></button>
              {showSemesterMenu && (
                <div className="semester-menu" ref={semesterMenuRef}>
                  <div className="menu-header"><h3>Select Semester</h3></div>
                  <div className="menu-items">
                    {semesters.map(s => (
                      <div key={s.id} className={`menu-item ${currentSemester?.id === s.id ? 'active' : ''}`} onClick={() => handleSemesterSelect(s)}>
                        <div className="menu-item-name">{s.name}</div>
                        <div className="menu-item-dates">{new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: theme + profile */}
        <div className="header-right desktop-profile">
          <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}>
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>
          <div className="user-profile">
            <div className="profile-container">
              <ProfileAvatar src={photoUrl} alt={user?.name || 'User'} className="profile-photo" onClick={toggleProfileDropdown} innerRef={profileRef} />
              {showProfileDropdown && (
                <div className="profile-dropdown" ref={profileDropdownRef}>
                  <div className="profile-info">
                    {photoUrl && <img src={photoUrl} alt={user?.name} className="dropdown-photo" referrerPolicy="no-referrer" />}
                    <div className="user-details">
                      <div className="user-name">{user?.name || 'User'}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="profile-action-item" onClick={handleShare} disabled={!hasCurrentSemester}>
                    <FaShareAlt /> Share Semester
                  </button>
                  <button className="profile-action-item" onClick={handleExport} disabled={!hasCurrentSemester}>
                    <FaFilePdf /> Export to PDF
                  </button>
                  <div className="dropdown-divider" />
                  <button className="profile-action-item danger" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Semester Form / Order Modal */}
      {showSemesterForm && (
        <SemesterForm
          semester={isEditingSemester ? currentSemester : null}
          onSubmit={isEditingSemester ? handleUpdateSemester : handleCreateSemesterSubmit}
          onCancel={() => { setShowSemesterForm(false); setIsCreating(false); }}
        />
      )}
      {showOrderModal && (
        <SemesterOrderModal semesters={semesters} onSave={handleReorderSemesters} onCancel={() => setShowOrderModal(false)} />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <button className="share-modal-close" onClick={() => setShowShareModal(false)}>
              <FaTimes />
            </button>
            <div className="share-modal-icon">
              <FaLink />
            </div>
            <h3>Share Semester</h3>

            {isSharing ? (
              <div className="share-loading">
                <div className="data-loading-spinner" />
                <p>Generating link...</p>
              </div>
            ) : shareLink ? (
              <>
                <p className="share-modal-desc">
                  Anyone with this link can view <strong>{currentSemester?.name}</strong> schedule (read-only).
                </p>
                <div className="share-link-box">
                  <input type="text" value={shareLink} readOnly className="share-link-input" />
                  <button className="share-copy-btn" onClick={handleCopyLink}>
                    {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy</>}
                  </button>
                </div>
                <p className="share-modal-hint">
                  The link will always show the latest version of your semester.
                </p>
              </>
            ) : (
              <p className="share-modal-error">Failed to generate link. Please try again.</p>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;