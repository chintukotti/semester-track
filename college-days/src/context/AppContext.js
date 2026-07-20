import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { format, differenceInDays, eachDayOfInterval, isSunday, isBefore, isToday } from 'date-fns';
import { auth, db } from '../firebase';
import {
  doc, setDoc, getDoc, getDocs, collection, query,
  where, updateDoc, deleteDoc, serverTimestamp, Timestamp, orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof val === 'string') return new Date(val);
  if (val instanceof Date) return val;
  return new Date();
};

const safeFormat = (date, fmt) => {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return format(d, fmt);
  } catch { return ''; }
};

const isSecondSaturday = (date) => {
  if (date.getDay() !== 6) return false;
  const day = date.getDate();
  return day >= 8 && day <= 14;
};

const getInitialTheme = () => {
  try { return localStorage.getItem('semestertrack-theme') || 'light'; }
  catch { return 'light'; }
};

const AppContext = createContext();

const initialState = {
  user: null, semesters: [], currentSemester: null, days: [],
  loading: true, authInitialized: false, theme: getInitialTheme()
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload, authInitialized: true };
    case 'LOGOUT': return { ...initialState, loading: false, authInitialized: true, theme: state.theme };
    case 'LOAD_DATA': return { ...state, semesters: action.payload.semesters || [], days: action.payload.days || [], currentSemester: action.payload.currentSemester || null, loading: false };
    case 'SET_THEME': return { ...state, theme: action.payload };
    case 'ADD_SEMESTER': return { ...state, semesters: [...state.semesters, action.payload], currentSemester: action.payload };
    case 'UPDATE_SEMESTER': return { ...state, semesters: state.semesters.map(s => s.id === action.payload.id ? action.payload : s), currentSemester: state.currentSemester?.id === action.payload.id ? action.payload : state.currentSemester };
    case 'DELETE_SEMESTER':
      const upd = state.semesters.filter(s => s.id !== action.payload);
      return { ...state, semesters: upd, currentSemester: state.currentSemester?.id === action.payload ? (upd[0] || null) : state.currentSemester };
    case 'REORDER_SEMESTERS': return { ...state, semesters: action.payload };
    case 'SET_CURRENT_SEMESTER': return { ...state, currentSemester: action.payload };
    case 'ADD_DAY': return { ...state, days: [...state.days, action.payload] };
    case 'UPDATE_DAY': return { ...state, days: state.days.map(d => d.id === action.payload.id ? action.payload : d) };
    default: return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    try { localStorage.setItem('semestertrack-theme', state.theme); } catch {}
  }, [state.theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fu) => {
      if (fu) {
        try {
          const ref = doc(db, 'users', fu.uid);
          const snap = await getDoc(ref);
          let ud;
          if (snap.exists()) {
            ud = snap.data();
            if (fu.photoURL && fu.photoURL !== ud.photoURL) {
              await updateDoc(ref, { photoURL: fu.photoURL });
              ud.photoURL = fu.photoURL;
            }
          } else {
            ud = { id: fu.uid, name: fu.displayName || fu.email.split('@')[0], email: fu.email, photoURL: fu.photoURL || '', theme: 'light', createdAt: serverTimestamp() };
            await setDoc(ref, ud);
          }
          ud.id = fu.uid;
          dispatch({ type: 'SET_USER', payload: ud });
          dispatch({ type: 'SET_THEME', payload: ud.theme || 'light' });
          await loadUserData(fu.uid);
        } catch (e) {
          console.error('Auth error:', e);
          dispatch({ type: 'SET_USER', payload: { id: fu.uid, name: fu.displayName || fu.email.split('@')[0], email: fu.email, photoURL: fu.photoURL || '' } });
          dispatch({ type: 'LOAD_DATA', payload: {} });
        }
      } else { dispatch({ type: 'LOGOUT' }); }
    });
    return () => unsub();
  }, []);

  const loadUserData = async (userId) => {
    try {
      let semesters = [];
      try {
        const q = query(collection(db, 'semesters'), where('userId', '==', userId), orderBy('order', 'asc'));
        const s = await getDocs(q);
        semesters = s.docs.map(d => ({ id: d.id, ...d.data(), startDate: toDate(d.data().startDate), endDate: toDate(d.data().endDate) }));
      } catch {
        const q = query(collection(db, 'semesters'), where('userId', '==', userId));
        const s = await getDocs(q);
        semesters = s.docs.map(d => ({ id: d.id, ...d.data(), startDate: toDate(d.data().startDate), endDate: toDate(d.data().endDate) }));
        semesters.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      const dq = query(collection(db, 'days'), where('userId', '==', userId));
      const ds = await getDocs(dq);
      const days = ds.docs.map(d => ({ id: d.id, ...d.data(), date: toDate(d.data().date) }));
      dispatch({ type: 'LOAD_DATA', payload: { semesters, days, currentSemester: semesters[0] || null } });
    } catch (e) {
      console.error('Load error:', e);
      dispatch({ type: 'LOAD_DATA', payload: {} });
    }
  };

  const toggleTheme = async () => {
    const t = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: t });
    if (state.user?.id) try { await updateDoc(doc(db, 'users', state.user.id), { theme: t }); } catch {}
  };

  const login = async () => ({ success: true });
  const register = async () => ({ success: true });
  const logout = async () => { try { await signOut(auth); dispatch({ type: 'LOGOUT' }); } catch {} };

  const addSemester = async (sem) => {
    if (!state.user?.id) throw new Error('Not authenticated');
    if (!sem?.name || !sem?.startDate || !sem?.endDate) throw new Error('All fields required');
    let sd = sem.startDate instanceof Date ? sem.startDate : new Date(sem.startDate);
    let ed = sem.endDate instanceof Date ? sem.endDate : new Date(sem.endDate);
    if (isNaN(sd.getTime()) || isNaN(ed.getTime())) throw new Error('Invalid dates');
    if (sd >= ed) throw new Error('End date must be after start date');
    if (state.semesters.find(s => s.name.toLowerCase() === sem.name.toLowerCase())) throw new Error('Name already exists');
    const ns = { name: sem.name.trim(), startDate: sd, endDate: ed, userId: state.user.id, order: state.semesters.length, createdAt: serverTimestamp() };
    const ref = doc(collection(db, 'semesters'));
    await setDoc(ref, ns);
    const created = { id: ref.id, ...ns };
    dispatch({ type: 'ADD_SEMESTER', payload: created });
    return created;
  };

  const updateSemester = async (id, data) => {
    if (!state.user?.id) throw new Error('Not authenticated');
    await updateDoc(doc(db, 'semesters', id), data);
    const u = { id, ...data, startDate: toDate(data.startDate), endDate: toDate(data.endDate) };
    dispatch({ type: 'UPDATE_SEMESTER', payload: u });
    return u;
  };

  const deleteSemester = async (id) => {
    if (!state.user?.id) throw new Error('Not authenticated');
    const ds = await getDocs(query(collection(db, 'days'), where('semesterId', '==', id)));
    await Promise.all(ds.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'semesters', id));
    dispatch({ type: 'DELETE_SEMESTER', payload: id });
  };

  const reorderSemesters = async (list) => {
    if (!state.user?.id) throw new Error('Not authenticated');
    await Promise.all(list.map((s, i) => updateDoc(doc(db, 'semesters', s.id), { order: i })));
    dispatch({ type: 'REORDER_SEMESTERS', payload: list });
  };

  const setCurrentSemester = (s) => dispatch({ type: 'SET_CURRENT_SEMESTER', payload: s });

  const addOrUpdateDay = async (dayData) => {
    if (!state.user?.id) throw new Error('Not authenticated');
    const idx = state.days.findIndex(d => d.semesterId === dayData.semesterId && safeFormat(new Date(d.date), 'yyyy-MM-dd') === safeFormat(new Date(dayData.date), 'yyyy-MM-dd'));
    const payload = { ...dayData, userId: state.user.id, date: new Date(dayData.date) };
    if (idx !== -1) {
      const ref = doc(db, 'days', state.days[idx].id);
      await updateDoc(ref, payload);
      const u = { id: state.days[idx].id, ...payload };
      dispatch({ type: 'UPDATE_DAY', payload: u });
      return u;
    } else {
      const ref = doc(collection(db, 'days'));
      await setDoc(ref, payload);
      const n = { id: ref.id, ...payload };
      dispatch({ type: 'ADD_DAY', payload: n });
      return n;
    }
  };

  const getDaysForCurrentSemester = () => {
    if (!state.currentSemester) return [];
    const sd = toDate(state.currentSemester.startDate);
    const ed = toDate(state.currentSemester.endDate);
    if (!sd || !ed || isNaN(sd.getTime()) || isNaN(ed.getTime())) return [];
    const today = new Date(); today.setHours(23, 59, 59, 999);
    const semDays = state.days.filter(d => { const dd = toDate(d.date); return d.semesterId === state.currentSemester.id && dd && !isNaN(dd.getTime()); });
    try {
      return eachDayOfInterval({ start: sd, end: ed }).map(date => {
        const ds = safeFormat(date, 'yyyy-MM-dd');
        const ex = semDays.find(d => safeFormat(toDate(d.date), 'yyyy-MM-dd') === ds);
        if (ex) return { date, type: ex.type, description: ex.description, id: ex.id };
        const isPast = isBefore(date, today) || isToday(date);
        if (isPast) {
          if (isSunday(date)) return { date, type: 'holiday', description: 'Sunday', id: null };
          if (isSecondSaturday(date)) return { date, type: 'holiday', description: '2nd Saturday', id: null };
          return { date, type: 'working', description: '', id: null };
        }
        return { date, type: '', description: '', id: null };
      });
    } catch { return []; }
  };

  const getSemesterStats = () => {
    const days = getDaysForCurrentSemester();
    const stats = { total: days.length, working: 0, holiday: 0, event: 0, exam: 0, break: 0 };
    days.forEach(d => { if (d.type && stats[d.type] !== undefined) stats[d.type]++; });
    const today = new Date();
    const ss = toDate(state.currentSemester?.startDate);
    const dp = ss ? differenceInDays(today, ss) + 1 : 0;
    const prog = stats.total > 0 ? Math.min(100, Math.round((dp / stats.total) * 100)) : 0;
    return { ...stats, progress: prog, daysPassed: dp };
  };
  // *** SHARE SEMESTER — FIXED ***
  const shareSemester = async () => {
    if (!state.user?.id) throw new Error('Not authenticated');
    if (!state.currentSemester) throw new Error('No semester selected');

    const days = getDaysForCurrentSemester();
    const stats = getSemesterStats();

    let shareId = state.currentSemester.shareId;

    // Convert days to plain serializable objects
    const serializedDays = days.map(d => ({
      date: d.date instanceof Date ? format(d.date, 'yyyy-MM-dd') : String(d.date),
      type: d.type || '',
      description: d.description || ''
    }));

    // Convert dates to ISO strings for consistent storage
    const startDateStr = state.currentSemester.startDate instanceof Date
      ? state.currentSemester.startDate.toISOString()
      : new Date(state.currentSemester.startDate).toISOString();

    const endDateStr = state.currentSemester.endDate instanceof Date
      ? state.currentSemester.endDate.toISOString()
      : new Date(state.currentSemester.endDate).toISOString();

    // Clean stats — only plain numbers
    const cleanStats = {
      total: stats.total || 0,
      working: stats.working || 0,
      holiday: stats.holiday || 0,
      event: stats.event || 0,
      exam: stats.exam || 0,
      break: stats.break || 0
    };

    const shareData = {
      semesterName: state.currentSemester.name,
      startDate: startDateStr,
      endDate: endDateStr,
      days: serializedDays,
      stats: cleanStats,
      sharedBy: state.user.id,
      sharedByName: state.user.name || state.user.email || 'Unknown',
      updatedAt: serverTimestamp()
    };

    console.log('Sharing semester:', {
      shareId,
      semesterName: shareData.semesterName,
      daysCount: serializedDays.length
    });

    try {
      if (shareId) {
        // Update existing share
        await setDoc(doc(db, 'sharedSemesters', shareId), shareData);
        console.log('Updated existing share:', shareId);
      } else {
        // Create new share
        shareId = generateId();
        shareData.createdAt = serverTimestamp();
        await setDoc(doc(db, 'sharedSemesters', shareId), shareData);
        console.log('Created new share:', shareId);

        // Save shareId back to semester
        await updateDoc(doc(db, 'semesters', state.currentSemester.id), { shareId });
        dispatch({
          type: 'UPDATE_SEMESTER',
          payload: { ...state.currentSemester, shareId }
        });
      }

      // Build share URL
      const url = new URL(window.location.href);
      url.searchParams.set('share', shareId);
      // Remove any hash
      url.hash = '';
      const shareUrl = url.toString();

      console.log('Share URL:', shareUrl);
      return shareUrl;
    } catch (err) {
      console.error('Error sharing semester:', err);
      throw err;
    }
  };

  return (
    <AppContext.Provider value={{
      ...state, login, register, logout,
      addSemester, updateSemester, deleteSemester,
      reorderSemesters, setCurrentSemester,
      addOrUpdateDay, getDaysForCurrentSemester, getSemesterStats,
      toggleTheme, shareSemester
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);