const STORAGE_PREFIX = 'compass_trainer_';
const CURRENT_TRAINER_KEY = 'compass_current_trainer';

/**
 * مدربون معرّفين مسبقًا — نفس فكرة presetStudents بالضبط.
 * المفتاح هو الجزء اللي قبل @ بالإيميل (بأحرف صغيرة).
 */
const presetTrainers = {
  ahmad: {
    fullName: 'Ahmad Khalil',
    displayName: 'Eng. Ahmad Khalil',
    major: 'Senior Software Architect', // نستخدمها كعنوان وظيفي (title) بنفس مكان "major" عند الطالب
    status: 'active',
    phone: '+970 59 111 2233',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    bio: 'Senior Software Architect at Compass Academy with 10+ years building large-scale systems.',
    stats: { coursesTeaching: 1, totalStudents: 1240, avgRating: 4.8 },
  },
  sara: {
    fullName: 'Sara Youssef',
    displayName: 'Eng. Sara Youssef',
    major: 'Mobile Engineering Lead',
    status: 'active',
    phone: '+970 59 444 5566',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    bio: 'Mobile Engineering Lead who has shipped 15+ Flutter apps to production.',
    stats: { coursesTeaching: 1, totalStudents: 980, avgRating: 4.6 },
  },
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const buildDefaultTrainer = (email) => {
  const namePart = email.split('@')[0] || 'Trainer';
  const cleanName = namePart.replace(/[._\-\d]+/g, ' ').trim() || 'Trainer';
  const displayName = cleanName.split(' ').filter(Boolean).map(capitalize).join(' ');

  return {
    fullName: displayName,
    displayName: `Eng. ${displayName}`,
    major: 'Instructor',
    status: 'active',
    phone: '',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
    bio: '',
    stats: { coursesTeaching: 0, totalStudents: 0, avgRating: 0 },
  };
};

export const getOrCreateTrainer = (rawEmail) => {
  const email = (rawEmail || '').trim().toLowerCase();
  if (!email) return null;

  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + email);
    if (saved) {
      return { ...JSON.parse(saved), email };
    }
  } catch {
    // تجاهل أخطاء القراءة
  }

  const localPart = email.split('@')[0];
  if (presetTrainers[localPart]) {
    return { ...presetTrainers[localPart], email };
  }

  return { ...buildDefaultTrainer(email), email };
};

export const saveTrainer = (trainerData) => {
  if (!trainerData?.email) return;
  const email = trainerData.email.trim().toLowerCase();
  try {
    localStorage.setItem(STORAGE_PREFIX + email, JSON.stringify(trainerData));
    localStorage.setItem(CURRENT_TRAINER_KEY, email);
  } catch {
    // تجاهل أخطاء الكتابة
  }
};

export const getCurrentTrainerEmail = () => {
  try {
    return localStorage.getItem(CURRENT_TRAINER_KEY);
  } catch {
    return null;
  }
};

export const clearCurrentTrainer = () => {
  try {
    localStorage.removeItem(CURRENT_TRAINER_KEY);
  } catch {
    // تجاهل
  }
};
