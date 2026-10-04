import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Course, CalendarEvent, AcademicSessionItem, ActiveNavTab, PRESET_COURSE_COLORS } from '../types/academic';

interface AcademicContextType {
  courses: Course[];
  events: CalendarEvent[];
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  selectedCourseIdForTimer: string | null;
  setSelectedCourseIdForTimer: (id: string | null) => void;
  selectedCourseForTimer: Course | null;
  
  // Course actions
  addCourse: (course: Omit<Course, 'id'>) => Course;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  getCourseById: (id: string | undefined) => Course | undefined;

  // Calendar Event actions
  addEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newDay: number, newStartTime: string, newEndTime: string) => void;

  // Calendar display filters & settings
  weekViewDays: 5 | 7;
  setWeekViewDays: (days: 5 | 7) => void;
  startHour: number;
  setStartHour: (hour: number) => void;
  endHour: number;
  setEndHour: (hour: number) => void;
  filterCourseId: string | null;
  setFilterCourseId: (id: string | null) => void;

  // Quick switch to timer for a course
  startTimerForCourse: (courseId: string, taskPrefix?: string) => void;
}

const AcademicContext = createContext<AcademicContextType | null>(null);

const safeLocalStorageSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[Storage Warning] Failed to write key "${key}" to LocalStorage:`, e);
  }
};

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

// Empty initial courses and events by default so users add their own custom curriculum
const INITIAL_COURSES: Course[] = [];
const INITIAL_EVENTS: CalendarEvent[] = [];

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('synchrony_academic_courses');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear out any old sample dummy courses if present
        if (Array.isArray(parsed) && parsed.some((c: any) => c.id === 'course-cmpe451')) {
          localStorage.removeItem('synchrony_academic_courses');
          return [];
        }
        return parsed;
      }
      return INITIAL_COURSES;
    } catch (e) {
      console.error('Failed to parse courses from storage:', e);
      return INITIAL_COURSES;
    }
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('synchrony_academic_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear out any old sample dummy events if present
        if (Array.isArray(parsed) && parsed.some((e: any) => e.id === 'evt-1')) {
          localStorage.removeItem('synchrony_academic_events');
          return [];
        }
        return parsed;
      }
      return INITIAL_EVENTS;
    } catch (e) {
      console.error('Failed to parse calendar events from storage:', e);
      return INITIAL_EVENTS;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveNavTab>(() => {
    try {
      const saved = localStorage.getItem('synchrony_active_tab');
      return (saved as ActiveNavTab) || 'focus';
    } catch (e) {
      return 'focus';
    }
  });

  const [selectedCourseIdForTimer, setSelectedCourseIdForTimer] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('synchrony_selected_course_timer');
      return saved === 'course-cmpe451' ? null : saved;
    } catch (e) {
      return null;
    }
  });

  const [weekViewDays, setWeekViewDays] = useState<5 | 7>(() => {
    try {
      const saved = localStorage.getItem('synchrony_week_view_days');
      return saved === '7' ? 7 : 5;
    } catch (e) {
      return 5;
    }
  });

  const [startHour, setStartHour] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('synchrony_calendar_start_hour');
      return saved ? parseInt(saved, 10) : 8;
    } catch (e) {
      return 8;
    }
  });

  const [endHour, setEndHour] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('synchrony_calendar_end_hour');
      return saved ? parseInt(saved, 10) : 20;
    } catch (e) {
      return 20;
    }
  });

  const [filterCourseId, setFilterCourseId] = useState<string | null>(null);

  // Persistence effects
  useEffect(() => {
    safeLocalStorageSetItem('synchrony_academic_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    safeLocalStorageSetItem('synchrony_academic_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    safeLocalStorageSetItem('synchrony_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (selectedCourseIdForTimer) {
      safeLocalStorageSetItem('synchrony_selected_course_timer', selectedCourseIdForTimer);
    }
  }, [selectedCourseIdForTimer]);

  useEffect(() => {
    safeLocalStorageSetItem('synchrony_week_view_days', weekViewDays.toString());
  }, [weekViewDays]);

  useEffect(() => {
    safeLocalStorageSetItem('synchrony_calendar_start_hour', startHour.toString());
  }, [startHour]);

  useEffect(() => {
    safeLocalStorageSetItem('synchrony_calendar_end_hour', endHour.toString());
  }, [endHour]);

  // Course operations
  const addCourse = useCallback((newCourseData: Omit<Course, 'id'>): Course => {
    const newCourse: Course = {
      ...newCourseData,
      id: generateUUID(),
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  }, []);

  const updateCourse = useCallback((id: string, updates: Partial<Course>) => {
    setCourses(prev =>
      prev.map(course => (course.id === id ? { ...course, ...updates } : course))
    );
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    // Also remove or unlink events for this course
    setEvents(prev => prev.filter(e => e.courseId !== id));
    // If it was selected for timer, clear it
    setSelectedCourseIdForTimer(prev => (prev === id ? null : prev));
  }, []);

  const getCourseById = useCallback(
    (id: string | undefined): Course | undefined => {
      if (!id) return undefined;
      return courses.find(c => c.id === id);
    },
    [courses]
  );

  // Calendar Event operations
  const addEvent = useCallback((newEventData: Omit<CalendarEvent, 'id'>): CalendarEvent => {
    const newEvent: CalendarEvent = {
      ...newEventData,
      id: generateUUID(),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev =>
      prev.map(event => (event.id === id ? { ...event, ...updates } : event))
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const moveEvent = useCallback(
    (id: string, newDay: number, newStartTime: string, newEndTime: string) => {
      setEvents(prev =>
        prev.map(event =>
          event.id === id
            ? { ...event, dayOfWeek: newDay, startTime: newStartTime, endTime: newEndTime }
            : event
        )
      );
    },
    []
  );

  const selectedCourseForTimer = useMemo(() => {
    return courses.find(c => c.id === selectedCourseIdForTimer) || null;
  }, [courses, selectedCourseIdForTimer]);

  const startTimerForCourse = useCallback((courseId: string, taskPrefix?: string) => {
    setSelectedCourseIdForTimer(courseId);
    setActiveTab('focus');
  }, []);

  const value = useMemo(
    () => ({
      courses,
      events,
      activeTab,
      setActiveTab,
      selectedCourseIdForTimer,
      setSelectedCourseIdForTimer,
      selectedCourseForTimer,
      addCourse,
      updateCourse,
      deleteCourse,
      getCourseById,
      addEvent,
      updateEvent,
      deleteEvent,
      moveEvent,
      weekViewDays,
      setWeekViewDays,
      startHour,
      setStartHour,
      endHour,
      setEndHour,
      filterCourseId,
      setFilterCourseId,
      startTimerForCourse,
    }),
    [
      courses,
      events,
      activeTab,
      selectedCourseIdForTimer,
      selectedCourseForTimer,
      addCourse,
      updateCourse,
      deleteCourse,
      getCourseById,
      addEvent,
      updateEvent,
      deleteEvent,
      moveEvent,
      weekViewDays,
      startHour,
      endHour,
      filterCourseId,
      startTimerForCourse,
    ]
  );

  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
