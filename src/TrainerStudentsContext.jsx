/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const TrainerStudentsContext = createContext(null);
const STORAGE_KEY = 'trainerStudentsRoster_v2';

const seedRoster = [
  { id: 1001, studentId: 'STU-1001', name: 'Maha Alashqar', email: 'maha.alashqar@email.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop&q=80', courseTitle: 'Full-Stack Development', progress: 82, completedSubmissions: 14, totalSubmissions: 16, lastActive: 'Today', activityDays: 0, status: 'on-track', access: 'active', joinedAt: '2026-08-02', rating: 4, feedback: '' },
  { id: 1002, studentId: 'STU-1002', name: 'Omar Fares', email: 'omar.fares@email.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80', courseTitle: 'AI & Machine Learning', progress: 76, completedSubmissions: 11, totalSubmissions: 14, lastActive: '2h ago', activityDays: 0, status: 'on-track', access: 'active', joinedAt: '2026-07-18', rating: 5, feedback: '' },
  { id: 1003, studentId: 'STU-1003', name: 'Lina Aboud', email: 'lina.aboud@email.com', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&fit=crop&q=80', courseTitle: 'UI/UX Design', progress: 68, completedSubmissions: 9, totalSubmissions: 12, lastActive: 'Yesterday', activityDays: 1, status: 'needs-feedback', access: 'active', joinedAt: '2026-07-10', rating: 4, feedback: 'Review pending on two submissions.' },
  { id: 1004, studentId: 'STU-1004', name: 'Yousef Saleh', email: 'yousef.saleh@email.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80', courseTitle: 'Software Architecture', progress: 48, completedSubmissions: 7, totalSubmissions: 13, lastActive: '8 days ago', activityDays: 8, status: 'inactive', access: 'limited', joinedAt: '2026-06-21', rating: 2, feedback: 'Needs a follow-up plan.' },
  { id: 1005, studentId: 'STU-1005', name: 'Mona Ali', email: 'mona.ali@email.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&fit=crop&q=80', courseTitle: 'Flutter Masterclass', progress: 32, completedSubmissions: 5, totalSubmissions: 12, lastActive: '5 days ago', activityDays: 5, status: 'late-tasks', access: 'active', joinedAt: '2026-08-05', rating: 2, feedback: 'Two assignments are overdue.' },
  { id: 1006, studentId: 'STU-1006', name: 'Noor Ahmed', email: 'noor.ahmed@email.com', avatar: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=150&fit=crop&q=80', courseTitle: 'Front-End Fundamentals', progress: 91, completedSubmissions: 15, totalSubmissions: 16, lastActive: 'Today', activityDays: 0, status: 'excellent', access: 'active', joinedAt: '2026-07-04', rating: 5, feedback: 'Excellent and consistent work.' },
];

const normalizeStudent = (student, index) => ({
  studentId: student.studentId || `STU-${1001 + index}`,
  completedSubmissions: student.completedSubmissions ?? Math.round((student.progress || 0) / 7),
  totalSubmissions: student.totalSubmissions ?? 16,
  lastActive: student.lastActive || 'Recently',
  activityDays: student.activityDays ?? 0,
  status: student.status || ((student.progress || 0) < 50 ? 'needs-attention' : 'on-track'),
  access: student.access || 'active',
  joinedAt: student.joinedAt || new Date().toISOString().slice(0, 10),
  rating: student.rating || 0,
  feedback: student.feedback || '',
  ...student,
});

export function TrainerStudentsProvider({ children }) {
  const [roster, setRoster] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : seedRoster;
      return (Array.isArray(parsed) ? parsed : seedRoster).map(normalizeStudent);
    } catch { return seedRoster; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(roster)); }, [roster]);

  const addStudent = (student) => {
    const created = normalizeStudent({ ...student, id: Date.now(), avatar: student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}` }, roster.length);
    setRoster((current) => [created, ...current]);
    return created;
  };
  const updateStudent = (id, changes) => setRoster((current) => current.map((student) => student.id === id ? { ...student, ...changes } : student));
  const toggleStudentAccess = (id) => setRoster((current) => current.map((student) => student.id === id ? { ...student, access: student.access === 'active' ? 'limited' : 'active' } : student));
  const rateStudent = (id, evaluation) => updateStudent(id, evaluation);

  const value = useMemo(() => ({ roster, addStudent, updateStudent, toggleStudentAccess, rateStudent }), [roster]);
  return <TrainerStudentsContext.Provider value={value}>{children}</TrainerStudentsContext.Provider>;
}

export function useTrainerStudents() {
  const context = useContext(TrainerStudentsContext);
  if (!context) throw new Error('useTrainerStudents must be used within TrainerStudentsProvider');
  return context;
}