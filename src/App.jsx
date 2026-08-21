import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './HomePage';
import LoginPage from './LoginPage';
import TrainerLogin from './TrainerLogin';
import TrainerDashboard from './TrainerDashboard';
import StudentDashboard from './StudentDashboard';
import EditProfile from './EditProfile';
import { CoursesProvider } from './CoursesContext';
import { CoursesCatalogProvider } from './CoursesCatalogContext';
import { DeadlinesProvider } from './DeadlinesContext';
import { SettingsProvider } from './SettingsContext';
import { MessagesProvider } from './MessagesContext';
import { TrainerMessagesProvider } from './TrainerMessagesContext';
import { ProjectsProvider } from './ProjectsContext';
import { TrainerAssignmentsProvider } from './TrainerAssignmentsContext';
import { TrainerStudentsProvider } from './TrainerStudentsContext';
import ForgotPassword from './ForgotPasswordPage';
import SignupPage from './SignupPage';
import { NotificationsProvider } from './NotificationsContext';
import { CompetitionsProvider } from './CompetitionsContext';
import { AnnouncementsProvider } from './AnnouncementsContext';
import { getOrCreateStudent, getCurrentUserEmail, saveStudent, clearCurrentUser } from './studentsData';
import { getOrCreateTrainer, getCurrentTrainerEmail, saveTrainer, clearCurrentTrainer } from './trainersData';
import './App.css';

function App() {

  const [studentData, setStudentData] = useState(() => {
    const savedEmail = getCurrentUserEmail();
    if (savedEmail) {
      const restored = getOrCreateStudent(savedEmail);
      if (restored) return restored;
    }
    return getOrCreateStudent('mohammed@university.edu.sa');
  });

  const [trainerData, setTrainerData] = useState(() => {
    const savedEmail = getCurrentTrainerEmail();
    if (savedEmail) {
      const restored = getOrCreateTrainer(savedEmail);
      if (restored) return restored;
    }
    return getOrCreateTrainer('ahmad@compass.edu.sa');
  });

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

  const handleLogin = (email) => {
    const student = getOrCreateStudent(email);
    setStudentData(student);
  };

  const handleTrainerLogin = (email) => {
    const trainer = getOrCreateTrainer(email);
    setTrainerData(trainer);
  };

  const handleTrainerUpdate = (profile) => {
    if (!profile?.email) return;
    setTrainerData(profile);
    saveTrainer(profile);
  };

  const handleLogout = () => {
    clearCurrentUser();
  };

  const handleTrainerLogout = () => {
    clearCurrentTrainer();
  };

  return (
    <SettingsProvider>
      <CoursesProvider>
        <CoursesCatalogProvider>
          <DeadlinesProvider>
            <MessagesProvider>
              <TrainerMessagesProvider>
                <ProjectsProvider>
                  <TrainerAssignmentsProvider>
                    <TrainerStudentsProvider>
                      <NotificationsProvider>
                        <AnnouncementsProvider>
                          <CompetitionsProvider>
                          <BrowserRouter>
                            <Routes>
                              <Route path="/" element={<Homepage />} />
                              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                              <Route path="/forgot-password" element={<ForgotPassword />} />
                              <Route path="/signup" element={<SignupPage onSignup={handleLogin} />} />
                              <Route path="/trainer-login" element={<TrainerLogin onLogin={handleTrainerLogin} />} />
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
                                  <StudentDashboard
                                    studentData={studentData}
                                    setStudentData={setStudentData}
                                    onLogout={handleLogout}
                                  />
                                }
                              />
                              <Route
                                path="/edit-profile"
                                element={<EditProfile student={studentData} onSave={setStudentData} />}
                              />
                            </Routes>
                          </BrowserRouter>
                          </CompetitionsProvider>
                        </AnnouncementsProvider>
                      </NotificationsProvider>
                    </TrainerStudentsProvider>
                  </TrainerAssignmentsProvider>
                </ProjectsProvider>
              </TrainerMessagesProvider>
            </MessagesProvider>
          </DeadlinesProvider>
        </CoursesCatalogProvider>
      </CoursesProvider>
    </SettingsProvider>
  );
}

export default App;
