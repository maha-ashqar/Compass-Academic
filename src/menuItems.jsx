import {
  FiHome, FiUser, FiBookOpen, FiAward, FiFileText,
  FiMessageSquare, FiSettings, FiBriefcase, FiTarget
} from 'react-icons/fi';

export const menuItems = [
  { id: 'Home', label: 'Home', icon: FiHome },
  { id: 'Profile', label: 'Profile', icon: FiUser },
  { id: 'Courses', label: 'Courses', icon: FiBookOpen },
  { id: 'MyCourses', label: 'My Courses', icon: FiBookOpen },
  { id: 'Competitions', label: 'Competitions', icon: FiTarget },
  { id: 'Assignments', label: 'Assignments', icon: FiFileText },
  { id: 'Projects gallery', label: 'Projects gallery', icon: FiBriefcase },
  { id: 'Messages', label: 'Messages', icon: FiMessageSquare },
  { id: 'Achievements', label: 'My Achievements', icon: FiAward },
  { id: 'Settings', label: 'Settings', icon: FiSettings },
];