/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const ProjectsContext = createContext(null);

const STORAGE_KEY = 'trainerProjects_v1';
const LIKES_STORAGE_KEY = 'galleryLikedProjects_v1';

// بيانات وهمية أولية — تمثّل مشاريع افترضنا إن الطلاب رفعوها مسبقًا
const seedProjects = [
  {
    id: 1,
    courseId: 1,
    courseTitle: 'Software Engineering',
    studentName: 'Mohammed Ali',
    studentEmail: 'mohammed@university.edu.sa',
    title: 'E-Commerce Microservices Architecture',
    description: 'A proposed microservices architecture diagram for an e-commerce platform, including service boundaries and API gateway design.',
    fileUrl: '#',
    submittedAt: '2026-07-10T09:00:00',
    status: 'pending',
  },
  {
    id: 2,
    courseId: 4,
    courseTitle: 'Advanced UI/UX Design',
    studentName: 'Maha Khaled',
    studentEmail: 'maha@university.edu.sa',
    title: 'Mobile Banking App Redesign',
    description: 'A full UX case study redesigning a mobile banking app onboarding flow, including personas and usability test results.',
    fileUrl: '#',
    submittedAt: '2026-07-12T14:30:00',
    status: 'pending',
  },
  {
    id: 3,
    courseId: 5,
    courseTitle: 'Full-Stack Web Development',
    studentName: 'Mohammed Ali',
    studentEmail: 'mohammed@university.edu.sa',
    title: 'Task Management REST API',
    description: 'A deployed full-stack task management app with authentication and a documented REST API.',
    fileUrl: '#',
    submittedAt: '2026-07-08T11:00:00',
    status: 'approved',
  },
];

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : seedProjects;
    } catch (error) {
      console.error('Failed to load projects from storage:', error);
      return seedProjects;
    }
  });

  // ===== نظام اللايكات الخاص بصفحة Projects Gallery (projectsData الثابتة) =====
  const [likedIds, setLikedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(LIKES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load liked projects from storage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save projects to storage:', error);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likedIds));
    } catch (error) {
      console.error('Failed to save liked projects to storage:', error);
    }
  }, [likedIds]);

  const isLiked = (id) => likedIds.includes(id);

  const toggleLike = (id) => {
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((likedId) => likedId !== id) : [...prev, id]
    );
  };

  const submitProject = (project) => {
    const newProject = {
      id: Date.now(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ...project,
    };
    setProjects((prev) => [newProject, ...prev]);
  };

  const approveProject = (id) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)));
  };

  const rejectProject = (id) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p)));
  };

  // المدرب بس يقدر يحذف مشروع لسا ما تمت الموافقة عليه (pending أو rejected)
  const deleteProject = (id) => {
    setProjects((prev) =>
      prev.filter((p) => !(p.id === id && p.status !== 'approved'))
    );
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        submitProject,
        approveProject,
        rejectProject,
        deleteProject,
        isLiked,
        toggleLike,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};
