/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const TrainerStudentsContext = createContext(null);

const STORAGE_KEY = 'trainerStudentsRoster_v1';

// قائمة وهمية بالطلاب — بما إنو ما في باك اند حقيقي يجمع كل الطلاب المسجّلين تلقائيًا
const seedRoster = [
  {
    id: 1,
    name: 'Mohammed Ali',
    email: 'mohammed@university.edu.sa',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    courseTitle: 'Software Engineering',
    progress: 74,
    rating: 4,
    feedback: 'Strong grasp of architecture concepts. Keep pushing on performance profiling.',
  },
  {
    id: 2,
    name: 'Maha Khaled',
    email: 'maha@university.edu.sa',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    courseTitle: 'Advanced UI/UX Design',
    progress: 40,
    rating: 0,
    feedback: '',
  },
  {
    id: 3,
    name: 'Anas A.',
    email: 'anas@university.edu.sa',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Anas',
    courseTitle: 'Full-Stack Web Development',
    progress: 58,
    rating: 5,
    feedback: 'Excellent problem solver, very consistent submissions.',
  },
];

export const TrainerStudentsProvider = ({ children }) => {
  const [roster, setRoster] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : seedRoster;
    } catch (error) {
      console.error('Failed to load student roster from storage:', error);
      return seedRoster;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    } catch (error) {
      console.error('Failed to save student roster to storage:', error);
    }
  }, [roster]);

  const rateStudent = (id, { rating, feedback }) => {
    setRoster((prev) =>
      prev.map((s) => (s.id === id ? { ...s, rating, feedback } : s))
    );
  };

  return (
    <TrainerStudentsContext.Provider value={{ roster, rateStudent }}>
      {children}
    </TrainerStudentsContext.Provider>
  );
};

export const useTrainerStudents = () => {
  const context = useContext(TrainerStudentsContext);
  if (!context) {
    throw new Error('useTrainerStudents must be used within a TrainerStudentsProvider');
  }
  return context;
};
