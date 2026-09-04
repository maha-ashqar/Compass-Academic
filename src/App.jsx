import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Homepage from './HomePage';
import LoginPage from './LoginPage';
import TrainerLogin from './TrainerLogin';
import TrainerDashboard from './TrainerDashboard';
import StudentDashboard from './StudentDashboard';
import EditProfile from './EditProfile';
import ForgotPassword from './ForgotPasswordPage';
import SignupPage from './SignupPage';

import { CoursesProvider } from './CoursesContext';
import { CoursesCatalogProvider } from './CoursesCatalogContext';
import { DeadlinesProvider } from './DeadlinesContext';
import { SettingsProvider } from './SettingsContext';
import { ConversationsProvider } from './SharedConversationsContext';
import { ProjectsProvider } from './ProjectsContext';
import { TrainerAssignmentsProvider } from './TrainerAssignmentsContext';
import { TrainerStudentsProvider } from './TrainerStudentsContext';
import { NotificationsProvider } from './NotificationsContext';
import { CompetitionsProvider } from './CompetitionsContext';
import { AnnouncementsProvider } from './AnnouncementsContext';
import StudentProtectedRoute from './StudentProtectedRoute';
import { getStudentProfile } from './api/studentProfile';
import PublicPortfolio from './PublicPortfolio';
import {
  getOrCreateStudent,
  getCurrentUserEmail,
  saveStudent,
  clearCurrentUser,
} from './studentsData';

import {
  getOrCreateTrainer,
  getCurrentTrainerEmail,
  saveTrainer,
  clearCurrentTrainer,
} from './trainersData';

import { getStudentMe, studentLogout } from './api/studentAuth';
import './App.css';

function App() {
  const [studentData, setStudentData] = useState(() => {
    const savedEmail = getCurrentUserEmail();

    if (savedEmail) {
      const restored = getOrCreateStudent(savedEmail);

      if (restored) {
        return restored;
      }
    }

    return getOrCreateStudent('mohammed@university.edu.sa');
  });
  const [isStudentAuthenticated, setIsStudentAuthenticated] = useState(false);
  const [isCheckingStudentAuth, setIsCheckingStudentAuth] = useState(true);
  const [trainerData, setTrainerData] = useState(() => {
    const savedEmail = getCurrentTrainerEmail();

    if (savedEmail) {
      const restored = getOrCreateTrainer(savedEmail);

      if (restored) {
        return restored;
      }
    }

    return getOrCreateTrainer('ahmad@compass.edu.sa');
  });

  useEffect(() => {
    const restoreStudentSession = async () => {
      const token =
        localStorage.getItem('student_token') ||
        sessionStorage.getItem('student_token');

      if (!token) {
        setIsStudentAuthenticated(false);
        setIsCheckingStudentAuth(false);
        return;
      }

      try {
        const data = await getStudentMe();
        const apiUser = data.user;
        const localStudent = getOrCreateStudent(apiUser.email);

        setStudentData({
          ...localStudent,
          fullName: apiUser.name || localStudent.fullName,
          displayName: apiUser.name || localStudent.displayName,
          email: apiUser.email,
          avatar: apiUser.avatar || localStudent.avatar,
          studentId: apiUser.student?.id ?? null,
          studentCode: apiUser.student?.student_code ?? null,
          portfolioCode: apiUser.student?.portfolio_code ?? null,
          professionalSummary:
            apiUser.student?.professional_summary ??
            localStudent.professionalSummary ??
            '',
          isVerified: apiUser.student?.is_verified ?? false,
        });

        setIsStudentAuthenticated(true);
      } catch (error) {
        console.error('Unable to restore student session:', error);

        localStorage.removeItem('student_token');
        sessionStorage.removeItem('student_token');

        setIsStudentAuthenticated(false);
      } finally {
        setIsCheckingStudentAuth(false);
      }
    };

    restoreStudentSession();
  }, []);

  useEffect(() => {
    if (studentData?.email) {
      saveStudent(studentData);
    }
  }, [studentData]);

  useEffect(() => {
    if (trainerData?.email) {
      saveTrainer(trainerData);
    }
  }, [trainerData]);
  const loadStudentProfile = async () => {
    const data = await getStudentProfile();
    const profile = data.profile;
    const education = profile.education;

    setStudentData((currentStudent) => ({
      ...currentStudent,
      fullName: profile.name,
      displayName: profile.name,
      email: profile.email,
      avatar: profile.avatar || currentStudent?.avatar,
      gender: profile.gender || '',
      dob: profile.date_of_birth || '',
      nationality: profile.nationality || '',
      phone: profile.phone || '',
      overview: profile.professional_summary || '',
      major: education?.major || '',
      program: education?.major || '',
      university: education?.university || '',
      college: education?.faculty || '',
      graduation: education?.expected_graduation_date || '',
      location: education?.location || '',
      studentCode: profile.student_code,
      portfolioCode: profile.portfolio_code,
      isVerified: profile.is_verified,
      skills: profile.skills?.map((skill) => skill.name) || [],
      connections: {
        ...(currentStudent?.connections || {}),
        github: profile.github_url || '',
        linkedin: profile.linkedin_url || '',
        gmail: profile.email || '',
      },
    }));
  };
  const handleLogin = async (email) => {
    const student = getOrCreateStudent(email);

    setStudentData(student);
    setIsStudentAuthenticated(true);

    try {
      await loadStudentProfile();
    } catch (error) {
      console.error('Unable to load student profile:', error);
    }
  };

  const handleTrainerLogin = (email) => {
    const trainer = getOrCreateTrainer(email);

    setTrainerData(trainer);
  };

  const handleTrainerUpdate = (profile) => {
    if (!profile?.email) {
      return;
    }

    setTrainerData(profile);
    saveTrainer(profile);
  };

  const handleLogout = async () => {
    try {
      await studentLogout();
    } catch (error) {
      console.error('Student logout failed:', error);
    } finally {
      clearCurrentUser();
      setIsStudentAuthenticated(false);
    }
  };

  const handleTrainerLogout = () => {
    clearCurrentTrainer();
  };

  return (
    <SettingsProvider>
      <CoursesProvider>
        <CoursesCatalogProvider>
          <DeadlinesProvider>
            <ConversationsProvider>
              <ProjectsProvider>
                <TrainerAssignmentsProvider>
                  <TrainerStudentsProvider>
                    <NotificationsProvider>
                      <AnnouncementsProvider>
                        <CompetitionsProvider>
                          <BrowserRouter>
                            <Routes>
                              <Route
                                path="/portfolio/:portfolioCode"
                                element={<PublicPortfolio />}
                              />
                              <Route
                                path="/"
                                element={<Homepage />}
                              />

                              <Route
  path="/login"
  element={
    isCheckingStudentAuth ? (
      null
    ) : isStudentAuthenticated ? (
      <Navigate
        to="/student-dashboard"
        replace
      />
    ) : (
      <LoginPage
        onLogin={handleLogin}
      />
    )
  }
/>

                              <Route
  path="/forgot-password"
  element={
    isCheckingStudentAuth ? null : isStudentAuthenticated ? (
      <Navigate to="/student-dashboard" replace />
    ) : (
      <ForgotPassword />
    )
  }
/>

                              {/* SignupPage is shared by both roles: which account gets
                                  created (student vs trainer) is decided inside the page
                                  itself via location.state.from, exactly like
                                  ForgotPasswordPage already does. Both handlers are just
                                  passed down so the page can call the right one. */}
                             <Route
  path="/signup"
  element={
    isCheckingStudentAuth ? null : isStudentAuthenticated ? (
      <Navigate to="/student-dashboard" replace />
    ) : (
      <SignupPage
        onStudentSignup={handleLogin}
        onTrainerSignup={handleTrainerLogin}
      />
    )
  }
/>

                              <Route
                                path="/trainer-login"
                                element={
                                  <TrainerLogin
                                    onLogin={handleTrainerLogin}
                                  />
                                }
                              />

                              <Route
                                path="/trainer-dashboard/*"
                                element={
                                  <TrainerDashboard
                                    trainerData={trainerData}
                                    onTrainerUpdate={handleTrainerUpdate}
                                    onLogout={handleTrainerLogout}
                                  />
                                }
                              />

                              <Route
                                path="/student-dashboard/*"
                                element={
                                  <StudentProtectedRoute
                                    isAuthenticated={isStudentAuthenticated}
                                    isCheckingAuth={isCheckingStudentAuth}
                                  >
                                    <StudentDashboard
                                      studentData={studentData}
                                      setStudentData={setStudentData}
                                      onLogout={handleLogout}
                                    />
                                  </StudentProtectedRoute>
                                }
                              />

                              <Route
                                path="/edit-profile"
                                element={
                                  <StudentProtectedRoute
                                    isAuthenticated={isStudentAuthenticated}
                                    isCheckingAuth={isCheckingStudentAuth}
                                  >
                                    <EditProfile
                                      student={studentData}
                                      onSave={setStudentData}
                                    />
                                  </StudentProtectedRoute>
                                }
                              />
                            </Routes>
                          </BrowserRouter>
                        </CompetitionsProvider>
                      </AnnouncementsProvider>
                    </NotificationsProvider>
                  </TrainerStudentsProvider>
                </TrainerAssignmentsProvider>
              </ProjectsProvider>
            </ConversationsProvider>
          </DeadlinesProvider>
        </CoursesCatalogProvider>
      </CoursesProvider>
    </SettingsProvider>
  );
}

export default App;