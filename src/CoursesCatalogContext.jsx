/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { coursesData as seedCourses } from './coursesData';

const CoursesCatalogContext = createContext(null);
const STORAGE_KEY = 'coursesCatalog_v1';
const now = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeLesson = (lesson) => ({
  id: lesson.id || makeId('lesson'),
  type: lesson.type || 'video',
  title: lesson.title || 'Untitled lesson',
  description: lesson.description || lesson.content || '',
  url: lesson.url || '',
  duration: lesson.duration || '',
  published: lesson.published !== false,
  resources: Array.isArray(lesson.resources) ? lesson.resources : [],
  views: Array.isArray(lesson.views) ? lesson.views : [],
  comments: Array.isArray(lesson.comments) ? lesson.comments : [],
});

const normalizeCourse = (course) => ({
  ...course,
  id: course.id ?? makeId('course'),
  status: course.status || 'published',
  createdAt: course.createdAt || now(),
  updatedAt: course.updatedAt || now(),
  modules: (course.modules || []).map((module) => ({
    ...module,
    id: module.id || makeId('module'),
    lessons: (module.lessons || []).map(normalizeLesson),
  })),
  auditLog: Array.isArray(course.auditLog) ? course.auditLog : [],
  archivedAt: course.archivedAt || null,
  deletedAt: course.deletedAt || null,
});

export const CoursesCatalogProvider = ({ children }) => {
  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return (saved ? JSON.parse(saved) : seedCourses).map(normalizeCourse);
    } catch {
      return seedCourses.map(normalizeCourse);
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const mutateCourse = (courseId, updater) => {
    let result = null;
    setCourses((current) => current.map((course) => {
      if (String(course.id) !== String(courseId)) return course;
      result = { ...updater(course), updatedAt: now() };
      return result;
    }));
    return result;
  };

  const createCourse = (data = {}) => {
    const course = normalizeCourse({
      id: makeId('course'),
      category: data.category || 'General',
      title: data.title || 'Untitled course',
      instructor: data.instructor || 'Course instructor',
      instructorTitle: data.instructorTitle || 'Instructor',
      level: data.level || 'Beginner',
      duration: data.duration || '4 Weeks',
      price: Number(data.price) || 0,
      description: data.description || '',
      coverImage: data.coverImage || '',
      students: 0,
      rating: 0,
      status: 'draft',
      createdByTrainer: true,
      modules: [],
      auditLog: [{ id: makeId('audit'), action: 'Course created as draft', at: now() }],
    });
    setCourses((current) => [course, ...current]);
    return course;
  };

  const addCourse = createCourse;
  const updateCourse = (courseId, changes) => mutateCourse(courseId, (course) => ({ ...course, ...changes }));
  const changeStatus = (courseId, status, action) => mutateCourse(courseId, (course) => ({
    ...course,
    status,
    auditLog: [...course.auditLog, { id: makeId('audit'), action, at: now() }],
  }));
  const publishCourse = (id) => changeStatus(id, 'published', 'Course published');
  const hideCourse = (id) => changeStatus(id, 'hidden', 'Course hidden from student catalog');
  const archiveCourse = (id) => mutateCourse(id, (course) => ({
    ...course, status: 'archived', archivedAt: now(),
    auditLog: [...course.auditLog, { id: makeId('audit'), action: 'Course archived', at: now() }],
  }));

  const deleteCourse = (courseId, { reason = '', canDeleteCourses = false } = {}) => {
    if (!canDeleteCourses || !reason.trim()) return { ok: false, error: 'Deletion reason is required.' };
    const course = courses.find((item) => String(item.id) === String(courseId));
    if (!course) return { ok: false, error: 'Course not found.' };
    if (Number(course.students) > 0) return { ok: false, error: 'This course has enrolled students. Archive it instead.' };
    mutateCourse(courseId, (item) => ({
      ...item, status: 'deleted', deletedAt: now(), deleteReason: reason,
      auditLog: [...item.auditLog, { id: makeId('audit'), action: `Course deleted: ${reason}`, at: now() }],
    }));
    return { ok: true };
  };

  const duplicateCourse = (courseId) => {
    const source = courses.find((course) => String(course.id) === String(courseId));
    if (!source) return null;
    const copy = normalizeCourse({
      ...source, id: makeId('course'), title: `${source.title} (Copy)`, status: 'draft',
      students: 0, rating: 0, createdAt: now(), updatedAt: now(),
      modules: source.modules.map((module) => ({
        ...module, id: makeId('module'),
        lessons: module.lessons.map((lesson) => ({ ...lesson, id: makeId('lesson'), views: [], comments: [] })),
      })),
      auditLog: [{ id: makeId('audit'), action: `Duplicated from ${source.title}`, at: now() }],
    });
    setCourses((current) => [copy, ...current]);
    return copy;
  };

  const addModule = (courseId, title) => {
    const module = { id: makeId('module'), title: title || 'New module', lessons: [] };
    mutateCourse(courseId, (course) => ({ ...course, modules: [...course.modules, module] }));
    return module;
  };
  const reorderModules = (courseId, fromIndex, toIndex) => mutateCourse(courseId, (course) => {
    const modules = [...course.modules];
    const [moved] = modules.splice(fromIndex, 1);
    modules.splice(toIndex, 0, moved);
    return { ...course, modules };
  });
  const addLesson = (courseId, moduleId, lesson) => {
    const created = normalizeLesson({ ...lesson, id: makeId('lesson') });
    mutateCourse(courseId, (course) => ({
      ...course,
      modules: course.modules.map((module) => String(module.id) === String(moduleId)
        ? { ...module, lessons: [...module.lessons, created] } : module),
    }));
    return created;
  };
  const updateVideoDetails = (courseId, moduleId, lessonId, changes) => mutateCourse(courseId, (course) => ({
    ...course,
    modules: course.modules.map((module) => String(module.id) === String(moduleId) ? {
      ...module,
      lessons: module.lessons.map((lesson) => String(lesson.id) === String(lessonId) ? { ...lesson, ...changes } : lesson),
    } : module),
  }));
  const uploadResource = (courseId, moduleId, lessonId, file) => {
    const resource = { id: makeId('resource'), name: file.name, type: file.type || 'file', size: file.size || 0, url: URL.createObjectURL(file) };
    updateVideoDetails(courseId, moduleId, lessonId, {});
    mutateCourse(courseId, (course) => ({
      ...course,
      modules: course.modules.map((module) => String(module.id) === String(moduleId) ? {
        ...module,
        lessons: module.lessons.map((lesson) => String(lesson.id) === String(lessonId)
          ? { ...lesson, resources: [...lesson.resources, resource] } : lesson),
      } : module),
    }));
    return resource;
  };
  const recordVideoView = (courseId, moduleId, lessonId, view) => mutateCourse(courseId, (course) => ({
    ...course,
    modules: course.modules.map((module) => String(module.id) === String(moduleId) ? {
      ...module,
      lessons: module.lessons.map((lesson) => String(lesson.id) === String(lessonId)
        ? { ...lesson, views: [...lesson.views, { id: makeId('view'), ...view, viewedAt: now() }] } : lesson),
    } : module),
  }));
  const calculateCompletion = (courseId, studentId) => {
    const course = courses.find((item) => String(item.id) === String(courseId));
    if (!course) return 0;
    const videos = course.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.type === 'video');
    if (!videos.length) return 0;
    const completed = videos.filter((lesson) => lesson.views.some((view) => String(view.studentId) === String(studentId) && Number(view.percent) >= 90)).length;
    return Math.round((completed / videos.length) * 100);
  };
  const addComment = (courseId, moduleId, lessonId, comment) => {
    const created = { id: makeId('comment'), ...comment, createdAt: now(), status: 'visible', replies: [] };
    mutateCourse(courseId, (course) => ({ ...course, modules: course.modules.map((module) => String(module.id) === String(moduleId) ? {
      ...module, lessons: module.lessons.map((lesson) => String(lesson.id) === String(lessonId) ? { ...lesson, comments: [...lesson.comments, created] } : lesson),
    } : module) }));
    return created;
  };
  const replyToComment = (courseId, moduleId, lessonId, commentId, reply) => mutateCourse(courseId, (course) => ({
    ...course, modules: course.modules.map((module) => String(module.id) === String(moduleId) ? {
      ...module, lessons: module.lessons.map((lesson) => String(lesson.id) === String(lessonId) ? {
        ...lesson, comments: lesson.comments.map((comment) => String(comment.id) === String(commentId)
          ? { ...comment, replies: [...comment.replies, { id: makeId('reply'), ...reply, createdAt: now() }] } : comment),
      } : lesson),
    } : module),
  }));
  const moderateComment = (courseId, moduleId, lessonId, commentId, { action, reason, moderator }) => {
    if (!reason?.trim()) return { ok: false, error: 'Moderation reason is required.' };
    mutateCourse(courseId, (course) => ({ ...course, modules: course.modules.map((module) => String(module.id) === String(moduleId) ? {
      ...module, lessons: module.lessons.map((lesson) => String(lesson.id) === String(lessonId) ? {
        ...lesson, comments: lesson.comments.map((comment) => String(comment.id) === String(commentId) ? {
          ...comment, status: action === 'delete' ? 'deleted' : 'hidden', moderation: { action, reason, moderator, at: now() },
        } : comment),
      } : lesson),
    } : module) }));
    return { ok: true };
  };

  const publishedCourses = useMemo(() => courses.filter((course) => course.status === 'published'), [courses]);
  const value = { courses, publishedCourses, createCourse, addCourse, updateCourse, publishCourse, hideCourse, archiveCourse, deleteCourse, duplicateCourse, addModule, reorderModules, addLesson, uploadResource, updateVideoDetails, recordVideoView, calculateCompletion, addComment, replyToComment, moderateComment };
  return <CoursesCatalogContext.Provider value={value}>{children}</CoursesCatalogContext.Provider>;
};

export const useCoursesCatalog = () => {
  const context = useContext(CoursesCatalogContext);
  if (!context) throw new Error('useCoursesCatalog must be used within a CoursesCatalogProvider');
  return context;
};
