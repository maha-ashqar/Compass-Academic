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

  // { [courseId]: [lessonId, lessonId, ...] }
  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      const saved = localStorage.getItem('completedLessons');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load lesson progress from storage:', error);
      return {};
    }
  });

  // { [courseId]: [lessonId, lessonId, ...] }
  const [bookmarkedLessons, setBookmarkedLessons] = useState(() => {
    try {
      const saved = localStorage.getItem('bookmarkedLessons');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load bookmarks from storage:', error);
      return {};
    }
  });

  // [assignmentId, assignmentId, ...]
  const [submittedAssignments, setSubmittedAssignments] = useState(() => {
    try {
      const saved = localStorage.getItem('submittedAssignments');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load submitted assignments from storage:', error);
      return [];
    }
  });

  // { [assignmentId]: { grade, feedback, gradedAt } } — يعبّيها المدرب
  const [grades, setGrades] = useState(() => {
    try {
      const saved = localStorage.getItem('assignmentGrades');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load grades from storage:', error);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('myCourses', JSON.stringify(myCourses));
    } catch (error) {
      console.error('Failed to save courses to storage:', error);
    }
  }, [myCourses]);

  useEffect(() => {
    try {
      localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
    } catch (error) {
      console.error('Failed to save lesson progress to storage:', error);
    }
  }, [completedLessons]);

  useEffect(() => {
    try {
      localStorage.setItem('bookmarkedLessons', JSON.stringify(bookmarkedLessons));
    } catch (error) {
      console.error('Failed to save bookmarks to storage:', error);
    }
  }, [bookmarkedLessons]);

  useEffect(() => {
    try {
      localStorage.setItem('submittedAssignments', JSON.stringify(submittedAssignments));
    } catch (error) {
      console.error('Failed to save submitted assignments to storage:', error);
    }
  }, [submittedAssignments]);

  useEffect(() => {
    try {
      localStorage.setItem('assignmentGrades', JSON.stringify(grades));
    } catch (error) {
      console.error('Failed to save grades to storage:', error);
    }
  }, [grades]);

  const enrollCourse = (course) => {
    setMyCourses((prev) => {
      const alreadyEnrolled = prev.some((c) => c.id === course.id);
      if (alreadyEnrolled) return prev;
      return [...prev, { ...course, enrolledAt: new Date().toISOString(), progress: 0 }];
    });
  };

  const unenrollCourse = (courseId) => {
    setMyCourses((prev) => prev.filter((c) => c.id !== courseId));
    setCompletedLessons((prev) => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
    setBookmarkedLessons((prev) => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
  };

  const isEnrolled = (courseId) => {
    return myCourses.some((c) => c.id === courseId);
  };

  const isLessonComplete = (courseId, lessonId) => {
    return (completedLessons[courseId] || []).includes(lessonId);
  };

  const toggleLessonComplete = (courseId, lessonId) => {
    setCompletedLessons((prev) => {
      const current = prev[courseId] || [];
      const next = current.includes(lessonId)
        ? current.filter((id) => id !== lessonId)
        : [...current, lessonId];
      return { ...prev, [courseId]: next };
    });
  };

  const getCourseProgress = (courseId, totalLessons) => {
    if (!totalLessons) return 0;
    const done = (completedLessons[courseId] || []).length;
    return Math.round((done / totalLessons) * 100);
  };

  const isBookmarked = (courseId, lessonId) => {
    return (bookmarkedLessons[courseId] || []).includes(lessonId);
  };

  const toggleBookmark = (courseId, lessonId) => {
    setBookmarkedLessons((prev) => {
      const current = prev[courseId] || [];
      const next = current.includes(lessonId)
        ? current.filter((id) => id !== lessonId)
        : [...current, lessonId];
      return { ...prev, [courseId]: next };
    });
  };

  const isAssignmentSubmitted = (assignmentId) => {
    return submittedAssignments.includes(assignmentId);
  };

  const toggleAssignmentSubmitted = (assignmentId) => {
    setSubmittedAssignments((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  // ============ التصحيح والتقييم (يستخدمها المدرب) ============
  const setGrade = (assignmentId, grade, feedback) => {
    setGrades((prev) => ({
      ...prev,
      [assignmentId]: { grade, feedback: feedback || '', gradedAt: new Date().toISOString() },
    }));
  };

  const getGrade = (assignmentId) => grades[assignmentId] || null;

  const clearGrade = (assignmentId) => {
    setGrades((prev) => {
      const next = { ...prev };
      delete next[assignmentId];
      return next;
    });
  };

  return (
    <CoursesContext.Provider
      value={{
        myCourses,
        enrollCourse,
        unenrollCourse,
        isEnrolled,
        isLessonComplete,
        toggleLessonComplete,
        getCourseProgress,
        isBookmarked,
        toggleBookmark,
        isAssignmentSubmitted,
        toggleAssignmentSubmitted,
        submittedAssignments,
        setGrade,
        getGrade,
        clearGrade,
      }}
    >
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
