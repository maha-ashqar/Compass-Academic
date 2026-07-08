/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const DeadlinesContext = createContext(null);

const defaultDeadlines = [
  { id: 1, title: 'Database Systems ERD Assignment', date: '2026-07-05', type: 'priority' },
  { id: 2, title: 'National AI Hackathon Registration', date: '2026-07-10', type: 'event' },
  { id: 3, title: 'Graduation Project Proposal', date: '2026-07-14', type: 'research' },
  { id: 4, title: 'Computer Networks Lab', date: '2026-07-20', type: 'practical' },
];

export const DeadlinesProvider = ({ children }) => {
  const [deadlines, setDeadlines] = useState(() => {
    try {
      const saved = localStorage.getItem('deadlines');
      return saved ? JSON.parse(saved) : defaultDeadlines;
    } catch (error) {
      console.error('Failed to load deadlines from storage:', error);
      return defaultDeadlines;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('deadlines', JSON.stringify(deadlines));
    } catch (error) {
      console.error('Failed to save deadlines to storage:', error);
    }
  }, [deadlines]);

  const addDeadline = (deadline) => {
    setDeadlines((prev) => [
      ...prev,
      { ...deadline, id: Date.now() },
    ]);
  };

  const removeDeadline = (id) => {
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
  };

  const sortedDeadlines = [...deadlines].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <DeadlinesContext.Provider
      value={{ deadlines: sortedDeadlines, addDeadline, removeDeadline }}
    >
      {children}
    </DeadlinesContext.Provider>
  );
};

export const useDeadlines = () => {
  const context = useContext(DeadlinesContext);
  if (!context) {
    throw new Error('useDeadlines must be used within a DeadlinesProvider');
  }
  return context;
};