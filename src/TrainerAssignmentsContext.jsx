/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const TrainerAssignmentsContext = createContext(null);

const STORAGE_KEY = 'trainerAssignments_v1';

export const TrainerAssignmentsProvider = ({ children }) => {
  const [assignments, setAssignments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load trainer assignments from storage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch (error) {
      console.error('Failed to save trainer assignments to storage:', error);
    }
  }, [assignments]);

  // المدرب بينشئ واجب جديد لكورس معيّن — رح يظهر مباشرة عند كل طالب مسجّل بهاد الكورس
  const addAssignment = ({ courseId, courseTitle, title, description, dueDate }) => {
    const newAssignment = {
      id: Date.now(),
      courseId,
      courseTitle,
      title,
      description,
      dueDate, // ISO date string (YYYY-MM-DD)
      createdAt: new Date().toISOString(),
      status: 'open', // 'open' | 'graded'
      grade: null,
      feedback: '',
    };
    setAssignments((prev) => [newAssignment, ...prev]);
    return newAssignment;
  };

  const deleteAssignment = (id) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  // تصحيح/تقييم الواجب — بيتحول لحالة "مصحّح" ويظهر التقييم والملاحظات عند الطالب
  const gradeAssignment = (id, { grade, feedback }) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'graded', grade, feedback } : a))
    );
  };

  const reopenAssignment = (id) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'open', grade: null, feedback: '' } : a))
    );
  };

  return (
    <TrainerAssignmentsContext.Provider
      value={{ assignments, addAssignment, deleteAssignment, gradeAssignment, reopenAssignment }}
    >
      {children}
    </TrainerAssignmentsContext.Provider>
  );
};

export const useTrainerAssignments = () => {
  const context = useContext(TrainerAssignmentsContext);
  if (!context) {
    throw new Error('useTrainerAssignments must be used within a TrainerAssignmentsProvider');
  }
  return context;
};
