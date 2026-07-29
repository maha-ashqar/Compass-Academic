const STORAGE_PREFIX = 'compass_student_';
const CURRENT_USER_KEY = 'compass_current_user';
const presetStudents = {
  mohammed: {
    fullName: 'mohammed ahmed mohammed ali',
    displayName: 'mohammed ali',
    major: 'MIS — Active Student',
    status: 'active',
    gender: 'male',
    dob: '14 مارس 2002',
    nationality: 'فلسطين',
    phone: '+970 59 123 4567',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    advisor: { name: 'Dr. Sarah Al-Mansour', dept: 'Computer Engineering Department' },
    college: 'College of Computer and Information Sciences',
    graduation: 'June 2027',
    overview: '',
    skills: ['UX Design', 'Data Structures'],
    connections: { github: '', linkedin: '', gmail: '' },
    stats: { activeCompetitions: 3, projectProgress: 74, certificatesEarned: 4 },
  },
  maha: {
    fullName: 'مها خالد أحمد',
    displayName: 'مها خالد',
    major: 'Computer Science — Active Student',
    status: 'active',
    gender: 'female',
    dob: '2 يناير 2003',
    nationality: 'فلسطين',
    phone: '+970 59 987 6543',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    advisor: { name: 'Dr. Layla Odeh', dept: 'Computer Science Department' },
    college: 'College of Computer and Information Sciences',
    graduation: 'June 2026',
    overview: '',
    skills: ['React', 'UI/UX Design'],
    connections: { github: '', linkedin: '', gmail: '' },
    stats: { activeCompetitions: 1, projectProgress: 40, certificatesEarned: 2 },
  },
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const buildDefaultStudent = (email) => {
  const namePart = email.split('@')[0] || 'Student';
  const cleanName = namePart.replace(/[._\-\d]+/g, ' ').trim() || 'Student';
  const displayName = cleanName.split(' ').filter(Boolean).map(capitalize).join(' ');

  return {
    fullName: displayName,
    displayName,
    major: 'Undeclared — New Student',
    status: 'active',
    gender: '',
    dob: '',
    nationality: '',
    phone: '',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
    advisor: { name: 'Not assigned yet', dept: '—' },
    college: 'College of Computer and Information Sciences',
    graduation: '—',
    overview: '',
    skills: [],
    connections: { github: '', linkedin: '', gmail: '' },
    stats: { activeCompetitions: 0, projectProgress: 0, certificatesEarned: 0 },
  };
};

export const getOrCreateStudent = (rawEmail) => {
  const email = (rawEmail || '').trim().toLowerCase();
  if (!email) return null;

  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + email);
    if (saved) {
      return { ...JSON.parse(saved), email };
    }
  } catch {
    // تجاهل أخطاء القراءة (مثلاً وضع التصفح الخاص)
  }

  const localPart = email.split('@')[0];
  if (presetStudents[localPart]) {
    return { ...presetStudents[localPart], email };
  }

  return { ...buildDefaultStudent(email), email };
};

// بتحفظ بيانات الطالب (بعد تعديل أو تسجيل دخول) بالمتصفح، وتحفظ مين آخر مستخدم داخل
export const saveStudent = (studentData) => {
  if (!studentData?.email) return;
  const email = studentData.email.trim().toLowerCase();
  try {
    localStorage.setItem(STORAGE_PREFIX + email, JSON.stringify(studentData));
    localStorage.setItem(CURRENT_USER_KEY, email);
  } catch {
    // تجاهل أخطاء الكتابة
  }
};

export const getCurrentUserEmail = () => {
  try {
    return localStorage.getItem(CURRENT_USER_KEY);
  } catch {
    return null;
  }
};

export const clearCurrentUser = () => {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch {
    // تجاهل
  }
};