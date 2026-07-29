/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { coursesData as seedCourses } from './coursesData';

const CoursesCatalogContext = createContext(null);

const STORAGE_KEY = 'coursesCatalog_v1';

export const CoursesCatalogProvider = ({ children }) => {
  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : seedCourses;
    } catch (error) {
      console.error('Failed to load courses catalog from storage:', error);
      return seedCourses;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    } catch (error) {
      console.error('Failed to save courses catalog to storage:', error);
    }
  }, [courses]);

  // إضافة كورس جديد من طرف المدرب
  const addCourse = (course) => {
    const newCourse = {
      id: Date.now(),
      category: course.category,
      title: course.title,
      instructor: course.instructor,
      instructorTitle: course.instructorTitle || '',
      instructorBio: course.instructorBio || '',
      level: course.level || 'Beginner',
      duration: course.duration || '4 Weeks',
      lessons: Number(course.lessons) || 0,
      rating: 0,
      students: 0,
      price: Number(course.price) || 0,
      description: course.description || '',
      whatYouWillLearn: course.whatYouWillLearn || [],
      requirements: course.requirements || [],
      modules: [],
      assignments: [],
      resources: [],
      createdByTrainer: true,
    };
    setCourses((prev) => [newCourse, ...prev]);
    return newCourse;
  };

  // حذف كورس من الكاتالوج (متاح دايمًا للمدرب صاحب الكورس)
  const deleteCourse = (courseId) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  return (
    <CoursesCatalogContext.Provider value={{ courses, addCourse, deleteCourse }}>
      {children}
    </CoursesCatalogContext.Provider>
  );
};

export const useCoursesCatalog = () => {
  const context = useContext(CoursesCatalogContext);
  if (!context) {
    throw new Error('useCoursesCatalog must be used within a CoursesCatalogProvider');
  }
  return context;
};
