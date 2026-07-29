/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const CompetitionsContext = createContext(null);

export const CompetitionsProvider = ({ children }) => {
  const [registeredIds, setRegisteredIds] = useState(() => {
    try {
      const saved = localStorage.getItem('registeredCompetitions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load competitions from storage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('registeredCompetitions', JSON.stringify(registeredIds));
    } catch (error) {
      console.error('Failed to save competitions to storage:', error);
    }
  }, [registeredIds]);

  const isRegistered = (id) => registeredIds.includes(id);

  const register = (id) => {
    setRegisteredIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const unregister = (id) => {
    setRegisteredIds((prev) => prev.filter((rid) => rid !== id));
  };

  return (
    <CompetitionsContext.Provider
      value={{ registeredIds, isRegistered, register, unregister }}
    >
      {children}
    </CompetitionsContext.Provider>
  );
};

export const useCompetitions = () => {
  const context = useContext(CompetitionsContext);
  if (!context) {
    throw new Error('useCompetitions must be used within a CompetitionsProvider');
  }
  return context;
};