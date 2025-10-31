import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { format, parseISO, differenceInDays, eachDayOfInterval, isSunday, isBefore, isToday } from 'date-fns';
import { auth, db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Generate unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Helper function to convert Firestore Timestamp to Date
const toDate = (dateValue) => {
  if (!dateValue) return null;
  
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  
  if (typeof dateValue === 'string') {
    return new Date(dateValue);
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  return new Date(); // Fallback
};

// Helper function to safely format dates
const safeFormat = (date, formatStr) => {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return '';
    }
    return format(dateObj, formatStr);
  } catch (err) {
    console.error('Error formatting date:', err);
    return '';
  }
};

const AppContext = createContext();

const initialState = {
  user: null,
  semesters: [],
  currentSemester: null,
  days: [],
  loading: true,
  authInitialized: false
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, authInitialized: true };
    case 'LOGOUT':
      return { ...initialState, loading: false, authInitialized: true };
    case 'LOAD_DATA':
      return { 
        ...state, 
        semesters: action.payload.semesters || [],
        days: action.payload.days || [],
        currentSemester: action.payload.currentSemester || null,
        loading: false
      };
    case 'ADD_SEMESTER':
      return { 
        ...state, 
        semesters: [...state.semesters, action.payload],
        currentSemester: action.payload
      };
    case 'UPDATE_SEMESTER':
      return { 
        ...state, 
        semesters: state.semesters.map(semester => 
          semester.id === action.payload.id ? action.payload : semester
        ),
        currentSemester: state.currentSemester?.id === action.payload.id ? action.payload : state.currentSemester
      };
    case 'DELETE_SEMESTER':
      const updatedSemesters = state.semesters.filter(semester => semester.id !== action.payload);
      return { 
        ...state, 
        semesters: updatedSemesters,
        currentSemester: state.currentSemester?.id === action.payload ? 
          (updatedSemesters.length > 0 ? updatedSemesters[0] : null) : state.currentSemester
      };
    case 'REORDER_SEMESTERS':
      return { 
        ...state, 
        semesters: action.payload
      };
    case 'SET_CURRENT_SEMESTER':
      return { 
        ...state, 
        currentSemester: action.payload
      };
    case 'ADD_DAY':
      return { 
        ...state, 
        days: [...state.days, action.payload]
      };
    case 'UPDATE_DAY':
      return { 
        ...state, 
        days: state.days.map(day => 
          day.id === action.payload.id ? action.payload : day
        )
      };
    case 'SET_AUTH_INITIALIZED':
      return { ...state, authInitialized: true };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Check for authenticated user on initial render
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Auth state changed. User is authenticated:", firebaseUser.uid);
        
        try {
          // Check if user exists in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          let userData;
          if (userDoc.exists()) {
            userData = userDoc.data();
            
            // Check if photo URL has changed in Firebase auth
            if (firebaseUser.photoURL && firebaseUser.photoURL !== userData.photoURL) {
              // Update the photo URL in Firestore
              await updateDoc(userRef, { photoURL: firebaseUser.photoURL });
              userData.photoURL = firebaseUser.photoURL;
            }
          } else {
            // Create new user document
            userData = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || '',
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, userData);
          }
          
          // Set user in context
          dispatch({ type: 'SET_USER', payload: userData });
          
          // Load user's semesters and days
          await loadUserData(firebaseUser.uid);
        } catch (error) {
          console.error("Error in auth state change:", error);
          // Even if there's an error, set the basic user info
          const basicUserData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || ''
          };
          dispatch({ type: 'SET_USER', payload: basicUserData });
        }
      } else {
        // User is logged out
        console.log("Auth state changed. User is not authenticated");
        dispatch({ type: 'LOGOUT' });
      }
      
      // Mark auth as initialized
      dispatch({ type: 'SET_AUTH_INITIALIZED' });
    });

    return () => unsubscribe();
  }, []);

  // Load user data from Firestore
  const loadUserData = async (userId) => {
    try {
      console.log("Loading user data for:", userId);
      
      // Load semesters - try with orderBy first, fallback to simple query if index not created yet
      let semesters = [];
      try {
        const semestersQuery = query(
          collection(db, 'semesters'), 
          where('userId', '==', userId),
          orderBy('order', 'asc')
        );
        const semestersSnapshot = await getDocs(semestersQuery);
        semesters = semestersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: toDate(data.startDate),
            endDate: toDate(data.endDate)
          };
        });
      } catch (error) {
        console.warn("Index not created yet, loading semesters without ordering:", error.message);
        // Fallback to simple query without orderBy
        const semestersQuery = query(
          collection(db, 'semesters'), 
          where('userId', '==', userId)
        );
        const semestersSnapshot = await getDocs(semestersQuery);
        semesters = semestersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startDate: toDate(data.startDate),
            endDate: toDate(data.endDate)
          };
        });
        // Sort semesters by order field in JavaScript
        semesters.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      
      console.log("Loaded semesters:", semesters);
      
      // Load days
      const daysQuery = query(collection(db, 'days'), where('userId', '==', userId));
      const daysSnapshot = await getDocs(daysQuery);
      const days = daysSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: toDate(data.date)
        };
      });
      
      console.log("Loaded days:", days.length);
      
      // Set first semester as current if none is selected
      let currentSemester = null;
      if (semesters.length > 0) {
        currentSemester = semesters[0];
      }
      
      dispatch({ 
        type: 'LOAD_DATA', 
        payload: {
          semesters,
          days,
          currentSemester
        }
      });
    } catch (err) {
      console.error('Error loading user data:', err);
      dispatch({ type: 'LOAD_DATA', payload: {} });
    }
  };

  // Authentication functions
  const login = async (email, password, userData = null) => {
    try {
      // For Google sign-in, userData is provided
      if (userData) {
        console.log("Logging in with user data:", userData);
        
        // Ensure user data has all required fields
        const completeUserData = {
          id: userData.id,
          name: userData.name || email.split('@')[0],
          email: userData.email || email,
          photoURL: userData.photoURL || ''
        };
        
        dispatch({ type: 'SET_USER', payload: completeUserData });
        await loadUserData(completeUserData.id);
        return { success: true };
      }
      
      // For email/password login (simplified for demo)
      // In a real app, you would use Firebase Auth for email/password
      const user = { 
        id: generateId(), 
        name: email.split('@')[0], 
        email
      };
      dispatch({ type: 'SET_USER', payload: user });
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      // In a real app, you would use Firebase Auth for registration
      const user = { id: generateId(), name, email };
      dispatch({ type: 'SET_USER', payload: user });
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out");
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Semester functions
  const addSemester = async (semester) => {
    try {
      console.log("Adding semester:", semester);
      
      // Check if user is authenticated
      if (!state.user || !state.user.id) {
        throw new Error('User not authenticated. Please log in and try again.');
      }
      
      // Check if semester data is valid
      if (!semester || typeof semester !== 'object') {
        console.error("Invalid semester data type:", typeof semester, semester);
        throw new Error('Invalid semester data');
      }
      
      // Check if required fields are present
      if (!semester.name || !semester.startDate || !semester.endDate) {
        console.error("Missing required fields:", {
          name: semester.name,
          startDate: semester.startDate,
          endDate: semester.endDate
        });
        throw new Error('Semester name, start date, and end date are required');
      }
      
      // Check if fields are of the correct type
      if (typeof semester.name !== 'string' || semester.name.trim() === '') {
        console.error("Invalid name field:", semester.name);
        throw new Error('Semester name must be a non-empty string');
      }
      
      console.log("User ID for semester creation:", state.user.id);
      
      // Convert dates to Date objects if they're strings
      let startDate, endDate;
      
      if (semester.startDate instanceof Date) {
        startDate = semester.startDate;
      } else if (typeof semester.startDate === 'string') {
        startDate = new Date(semester.startDate);
      } else {
        console.error("Invalid start date type:", typeof semester.startDate, semester.startDate);
        throw new Error('Start date must be a Date object or a date string');
      }
      
      if (semester.endDate instanceof Date) {
        endDate = semester.endDate;
      } else if (typeof semester.endDate === 'string') {
        endDate = new Date(semester.endDate);
      } else {
        console.error("Invalid end date type:", typeof semester.endDate, semester.endDate);
        throw new Error('End date must be a Date object or a date string');
      }
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Invalid date values:", {
          startDate: startDate,
          endDate: endDate,
          startDateValid: !isNaN(startDate.getTime()),
          endDateValid: !isNaN(endDate.getTime())
        });
        throw new Error('Invalid date format');
      }
      
      if (startDate >= endDate) {
        console.error("Invalid date range:", {
          startDate: startDate,
          endDate: endDate,
          comparison: startDate >= endDate
        });
        throw new Error('End date must be after start date');
      }
      
      // Check if a semester with the same name already exists
      const existingSemester = state.semesters.find(s => 
        s.name.toLowerCase() === semester.name.toLowerCase()
      );
      
      if (existingSemester) {
        console.log("Semester with same name already exists:", existingSemester);
        throw new Error('A semester with this name already exists');
      }
      
      // Calculate order - new semesters get added to the end
      const order = state.semesters.length;
      
      const newSemester = {
        name: semester.name.trim(),
        startDate,
        endDate,
        userId: state.user.id,
        order,
        createdAt: serverTimestamp()
      };
      
      console.log("Creating new semester in Firestore:", newSemester);
      
      // Add to Firestore
      const semesterRef = doc(collection(db, 'semesters'));
      await setDoc(semesterRef, newSemester);
      
      const createdSemester = {
        id: semesterRef.id,
        ...newSemester
      };
      
      console.log("Created semester:", createdSemester);
      
      // Update the state
      dispatch({ type: 'ADD_SEMESTER', payload: createdSemester });
      
      // Return the created semester
      return createdSemester;
    } catch (err) {
      console.error('Error adding semester:', err);
      // Re-throw the error to be caught by the caller
      throw err;
    }
  };

  const updateSemester = async (semesterId, semesterData) => {
    try {
      console.log("Updating semester:", semesterId, semesterData);
      
      // Check if user is authenticated
      if (!state.user || !state.user.id) {
        throw new Error('User not authenticated. Please log in and try again.');
      }
      
      const semesterRef = doc(db, 'semesters', semesterId);
      await updateDoc(semesterRef, semesterData);
      
      const updatedSemester = {
        id: semesterId,
        ...semesterData,
        startDate: toDate(semesterData.startDate),
        endDate: toDate(semesterData.endDate)
      };
      
      console.log("Updated semester:", updatedSemester);
      
      dispatch({ type: 'UPDATE_SEMESTER', payload: updatedSemester });
      return updatedSemester;
    } catch (err) {
      console.error('Error updating semester:', err);
      throw err;
    }
  };

  const deleteSemester = async (semesterId) => {
    try {
      console.log("Deleting semester:", semesterId);
      
      // Check if user is authenticated
      if (!state.user || !state.user.id) {
        throw new Error('User not authenticated. Please log in and try again.');
      }
      
      // Delete all days associated with this semester
      const daysQuery = query(collection(db, 'days'), where('semesterId', '==', semesterId));
      const daysSnapshot = await getDocs(daysQuery);
      
      const deletePromises = daysSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete the semester
      await deleteDoc(doc(db, 'semesters', semesterId));
      
      console.log("Deleted semester:", semesterId);
      
      dispatch({ type: 'DELETE_SEMESTER', payload: semesterId });
      return true;
    } catch (err) {
      console.error('Error deleting semester:', err);
      throw err;
    }
  };

  const reorderSemesters = async (updatedSemesters) => {
    try {
      console.log("Reordering semesters");
      
      // Check if user is authenticated
      if (!state.user || !state.user.id) {
        throw new Error('User not authenticated. Please log in and try again.');
      }
      
      // Update each semester with its new order
      const updatePromises = updatedSemesters.map((semester, index) => {
        const semesterRef = doc(db, 'semesters', semester.id);
        return updateDoc(semesterRef, { order: index });
      });
      
      await Promise.all(updatePromises);
      
      dispatch({ type: 'REORDER_SEMESTERS', payload: updatedSemesters });
      return true;
    } catch (err) {
      console.error('Error reordering semesters:', err);
      throw err;
    }
  };

  const setCurrentSemester = (semester) => {
    console.log("Setting current semester:", semester);
    dispatch({ type: 'SET_CURRENT_SEMESTER', payload: semester });
  };

  // Day functions
  const addOrUpdateDay = async (dayData) => {
    try {
      // Check if user is authenticated
      if (!state.user || !state.user.id) {
        throw new Error('User not authenticated. Please log in and try again.');
      }
      
      const existingDayIndex = state.days.findIndex(
        day => day.semesterId === dayData.semesterId && 
               safeFormat(new Date(day.date), 'yyyy-MM-dd') === safeFormat(new Date(dayData.date), 'yyyy-MM-dd')
      );

      const dayPayload = {
        ...dayData,
        userId: state.user.id,
        date: new Date(dayData.date) // Ensure it's a Date object
      };

      if (existingDayIndex !== -1) {
        // Update existing day in Firestore
        const dayRef = doc(db, 'days', state.days[existingDayIndex].id);
        await updateDoc(dayRef, dayPayload);
        
        const updatedDay = {
          id: state.days[existingDayIndex].id,
          ...dayPayload
        };
        
        dispatch({ type: 'UPDATE_DAY', payload: updatedDay });
        return updatedDay;
      } else {
        // Add new day to Firestore
        const dayRef = doc(collection(db, 'days'));
        await setDoc(dayRef, dayPayload);
        
        const newDay = {
          id: dayRef.id,
          ...dayPayload
        };
        
        dispatch({ type: 'ADD_DAY', payload: newDay });
        return newDay;
      }
    } catch (err) {
      console.error('Error adding/updating day:', err);
      throw err;
    }
  };

  // Get all days in the current semester
  const getDaysForCurrentSemester = () => {
    if (!state.currentSemester) return [];
    
    const startDate = toDate(state.currentSemester.startDate);
    const endDate = toDate(state.currentSemester.endDate);
    
    // Validate dates
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid semester dates:', { startDate, endDate });
      return [];
    }
    
    const today = new Date();
    
    // Get all days for this semester from state
    const semesterDays = state.days.filter(day => {
      const dayDate = toDate(day.date);
      return day.semesterId === state.currentSemester.id && 
             dayDate && 
             !isNaN(dayDate.getTime());
    });
    
    // Create array of all days in the semester
    try {
      const allDays = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
        const dateStr = safeFormat(date, 'yyyy-MM-dd');
        const existingDay = semesterDays.find(day => {
          const dayDate = toDate(day.date);
          return dayDate && safeFormat(dayDate, 'yyyy-MM-dd') === dateStr;
        });
        
        // Set Sunday as holiday by default if not explicitly set
        const isSundayHoliday = isSunday(date) && !existingDay;
        
        // Only mark days up to today as working by default, leave future days blank
        let defaultType = '';
        let defaultDescription = '';
        
        if (isBefore(date, today) || isToday(date)) {
          defaultType = isSundayHoliday ? 'holiday' : 'working';
          defaultDescription = isSundayHoliday ? 'Sunday' : '';
        }
        
        return {
          date,
          type: existingDay ? existingDay.type : defaultType,
          description: existingDay ? existingDay.description : defaultDescription,
          id: existingDay ? existingDay.id : null
        };
      });
      
      return allDays;
    } catch (err) {
      console.error('Error creating day interval:', err);
      return [];
    }
  };

  // Get statistics for current semester
  const getSemesterStats = () => {
    const days = getDaysForCurrentSemester();
    
    const stats = {
      total: days.length,
      working: 0,
      holiday: 0,
      event: 0,
      exam: 0,
      break: 0
    };
    
    days.forEach(day => {
      if (day.type) { // Only count days that have a type set
        stats[day.type]++;
      }
    });
    
    // Calculate progress
    const today = new Date();
    const semesterStart = toDate(state.currentSemester?.startDate);
    const daysPassed = semesterStart ? 
      differenceInDays(today, semesterStart) + 1 : 0;
    const progress = stats.total > 0 ? 
      Math.min(100, Math.round((daysPassed / stats.total) * 100)) : 0;
    
    return { ...stats, progress, daysPassed };
  };

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      addSemester,
      updateSemester,
      deleteSemester,
      reorderSemesters,
      setCurrentSemester,
      addOrUpdateDay,
      getDaysForCurrentSemester,
      getSemesterStats
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);