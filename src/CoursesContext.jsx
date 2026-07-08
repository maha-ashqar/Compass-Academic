/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const CoursesContext = createContext(null);

export const CoursesProvider = ({ children }) => {
  const [myCourses, setMyCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('myCourses');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load courses from storage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('myCourses', JSON.stringify(myCourses));
    } catch (error) {
      console.error('Failed to save courses to storage:', error);
    }
  }, [myCourses]);

  const enrollCourse = (course) => {
    setMyCourses((prev) => {
      const alreadyEnrolled = prev.some((c) => c.id === course.id);
      if (alreadyEnrolled) return prev;
      return [...prev, { ...course, enrolledAt: new Date().toISOString(), progress: 0 }];
    });
  };

  const unenrollCourse = (courseId) => {
    setMyCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const isEnrolled = (courseId) => {
    return myCourses.some((c) => c.id === courseId);
  };

  return (
    <CoursesContext.Provider value={{ myCourses, enrollCourse, unenrollCourse, isEnrolled }}>
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = () => {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
};