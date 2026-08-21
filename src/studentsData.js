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
    fullName: 'Maha Mahmoud Al-Ashqar',
    displayName: 'Maha',
    major: 'Computer Engineering',
    program: 'Computer Engineering',
    university: 'Al-Azhar University – Gaza',
    status: 'active',
    gender: 'female',
    dob: '17 April 2004',
    nationality: 'Palestinian',
    location: 'Gaza, Palestine',
    phone: '+970 59 561 4277',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    advisor: { name: 'Dr. Layla Odeh', dept: 'Computer Engineering Department' },
    college: 'Faculty of Engineering and Information Technology',
    graduation: 'June 2027',
    overview: 'Front-end developer and Computer Engineering student interested in building accessible digital products, practical learning experiences, and student-centered technology.',
    currentFocus: 'Front-end development · Product design · Practical projects',
    preferredLanguage: 'Arabic & English',
    languages: [
      { name: 'Arabic', level: 'Native' },
      { name: 'English', level: 'Intermediate' },
    ],
    skills: ['React', 'JavaScript', 'UI/UX Design', 'Figma'],
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
    program: 'Undeclared',
    university: 'Al-Azhar University – Gaza',
    status: 'active',
    gender: '',
    dob: '',
    nationality: '',
    location: '',
    phone: '',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
    advisor: { name: 'Not assigned yet', dept: '—' },
    college: 'College of Computer and Information Sciences',
    graduation: '—',
    overview: '',
    currentFocus: '',
    preferredLanguage: 'Arabic & English',
    languages: [
      { name: 'Arabic', level: 'Native' },
      { name: 'English', level: 'Intermediate' },
    ],
    skills: [],
    connections: { github: '', linkedin: '', gmail: '' },
    stats: { activeCompetitions: 0, projectProgress: 0, certificatesEarned: 0 },
  };
};

export const getOrCreateStudent = (rawEmail) => {
  const email = (rawEmail || '').trim().toLowerCase();
  if (!email) return null;
  const localPart = email.split('@')[0];
  const preset =
    presetStudents[localPart] ||
    (localPart.includes('maha') ? presetStudents.maha : null);

  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + email);
    if (saved) {
      const parsed = JSON.parse(saved);
      const hadPlaceholderMajor =
        !parsed.major ||
        String(parsed.major).toLowerCase().includes('undeclared');

      return {
        ...(preset || buildDefaultStudent(email)),
        ...parsed,
        major: hadPlaceholderMajor
          ? (preset?.major || parsed.major)
          : parsed.major,
        program: hadPlaceholderMajor
          ? (preset?.program || parsed.program)
          : (parsed.program || parsed.major),
        university:
          parsed.university ||
          preset?.university ||
          'Al-Azhar University – Gaza',
        advisor: {
          ...(preset?.advisor || {}),
          ...(parsed.advisor || {}),
        },
        connections: {
          ...(preset?.connections || {}),
          ...(parsed.connections || {}),
        },
        stats: {
          ...(preset?.stats || {}),
          ...(parsed.stats || {}),
        },
        email,
      };
    }
  } catch {
    // تجاهل أخطاء القراءة (مثلاً وضع التصفح الخاص)
  }

  if (preset) {
    return { ...preset, email };
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

/*
 * تُرجع نشاطات الطالب بدون أن تتسبب في انهيار صفحة الملف الشخصي
 * إذا لم تكن بيانات النشاط موجودة بعد.
 *
 * تقبل بيانات الطالب مباشرة أو بريده الإلكتروني لتظل متوافقة
 * مع جميع أماكن الاستدعاء في المشروع.
 */
export const getRecentActivity = (studentOrEmail) => {
  let student = studentOrEmail;

  if (typeof studentOrEmail === 'string') {
    student = getOrCreateStudent(studentOrEmail);
  }

  if (!student || typeof student !== 'object') {
    return [];
  }

  return Array.isArray(student.recentActivity)
    ? student.recentActivity
    : [];
};

export const clearCurrentUser = () => {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch {
    // تجاهل
  }
};
