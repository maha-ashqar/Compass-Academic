import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './HomePage';
import LoginPage from './LoginPage';
import TrainerLogin from './TrainerLogin'
import StudentDashboard from './StudentDashboard';
import EditProfile from './EditProfile';
import { CoursesProvider } from './CoursesContext';
import { DeadlinesProvider } from './DeadlinesContext';
import { SettingsProvider } from './SettingsContext';
import ForgotPassword from './ForgotPasswordPage';
import SignupPage from './SignupPage';
import './App.css';

function App() {
  const [studentData, setStudentData] = useState({
    fullName: 'mohammed ahmed mohammed ali',
    displayName: 'mohammed ali',
    major: 'MIS — Active Student',
    status: 'active',
    gender: 'male',
    dob: '14 مارس 2002',
    nationality: 'فلسطين',
    phone: '+970 59 123 4567',
    email: 'mohammed@university.edu.sa',
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    advisor: { name: 'Dr. Sarah Al-Mansour', dept: 'Computer Engineering Department' },
    college: 'College of Computer and Information Sciences',
    graduation: 'June 2027',
    overview: '',
    skills: ['UX Design', 'Data Structures'],
    connections: {
      github: '',
      linkedin: '',
      gmail: '',
    },
    stats: {
      activeCompetitions: 3,
      projectProgress: 74,
      certificatesEarned: 4,
    }
  });

  return (
    <SettingsProvider>
      <CoursesProvider>
        <DeadlinesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/trainer-login" element={<TrainerLogin />} />
              <Route
                path="/student-dashboard"
                element={<StudentDashboard studentData={studentData} setStudentData={setStudentData} />}
              />
              <Route
                path="/edit-profile"
                element={<EditProfile student={studentData} onSave={setStudentData} />}
              />
            </Routes>
          </BrowserRouter>
        </DeadlinesProvider>
      </CoursesProvider>
    </SettingsProvider>
  );
}

export default App;