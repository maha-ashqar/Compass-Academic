import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

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
import {
  TrainerNotificationsProvider,
} from './TrainerNotificationsContext';
import { CompetitionsProvider } from './CompetitionsContext';
import { AnnouncementsProvider } from './AnnouncementsContext';

import StudentProtectedRoute from './StudentProtectedRoute';
import TrainerProtectedRoute from './TrainerProtectedRoute';
import PublicPortfolio from './PublicPortfolio';

import { getStudentProfile } from './api/studentProfile';
import {
  getStudentMe,
  studentLogout,
} from './api/studentAuth';
import {
  getTrainerMe,
  trainerLogout,
} from './api/trainerAuth';

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

import './App.css';

function App() {
  const [studentData, setStudentData] =
    useState(() => {
      const savedEmail =
        getCurrentUserEmail();

      if (savedEmail) {
        const restored =
          getOrCreateStudent(savedEmail);

        if (restored) {
          return restored;
        }
      }

      return getOrCreateStudent(
        'mohammed@university.edu.sa'
      );
    });

  const [
    isStudentAuthenticated,
    setIsStudentAuthenticated,
  ] = useState(false);

  const [
    isCheckingStudentAuth,
    setIsCheckingStudentAuth,
  ] = useState(true);

  const [trainerData, setTrainerData] =
    useState(() => {
      const savedEmail =
        getCurrentTrainerEmail();

      if (savedEmail) {
        const restored =
          getOrCreateTrainer(savedEmail);

        if (restored) {
          return restored;
        }
      }

      return getOrCreateTrainer(
        'ahmad@compass.edu.sa'
      );
    });

  const [
    isTrainerAuthenticated,
    setIsTrainerAuthenticated,
  ] = useState(false);

  const [
    isCheckingTrainerAuth,
    setIsCheckingTrainerAuth,
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Restore student session
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const restoreStudentSession =
      async () => {
        const token =
          localStorage.getItem(
            'student_token'
          ) ||
          sessionStorage.getItem(
            'student_token'
          );

        if (!token) {
          setIsStudentAuthenticated(
            false
          );

          setIsCheckingStudentAuth(
            false
          );

          return;
        }

        try {
          const data =
            await getStudentMe();

          const apiUser = data.user;

          const localStudent =
            getOrCreateStudent(
              apiUser.email
            );

          setStudentData({
            ...localStudent,

            fullName:
              apiUser.name ||
              localStudent.fullName,

            displayName:
              apiUser.name ||
              localStudent.displayName,

            email: apiUser.email,

            avatar:
              apiUser.avatar ||
              localStudent.avatar,

            studentId:
              apiUser.student?.id ??
              null,

            studentCode:
              apiUser.student
                ?.student_code ??
              null,

            portfolioCode:
              apiUser.student
                ?.portfolio_code ??
              null,

            professionalSummary:
              apiUser.student
                ?.professional_summary ??
              localStudent
                .professionalSummary ??
              '',

            isVerified:
              apiUser.student
                ?.is_verified ??
              false,
          });

          setIsStudentAuthenticated(
            true
          );
        } catch (error) {
          console.error(
            'Unable to restore student session:',
            error
          );

          localStorage.removeItem(
            'student_token'
          );

          sessionStorage.removeItem(
            'student_token'
          );

          setIsStudentAuthenticated(
            false
          );
        } finally {
          setIsCheckingStudentAuth(
            false
          );
        }
      };

    restoreStudentSession();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Restore trainer session
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const restoreTrainerSession =
      async () => {
        const token =
          localStorage.getItem(
            'trainer_token'
          ) ||
          sessionStorage.getItem(
            'trainer_token'
          );

        if (!token) {
          setIsTrainerAuthenticated(
            false
          );

          setIsCheckingTrainerAuth(
            false
          );

          return;
        }

        try {
          const data =
            await getTrainerMe();

          const apiUser = data.user;

          const localTrainer =
            getOrCreateTrainer(
              apiUser.email
            );

          setTrainerData({
            ...localTrainer,

            fullName:
              apiUser.name ||
              localTrainer.fullName,

            displayName:
              apiUser.name
                ? `Eng. ${apiUser.name}`
                : localTrainer.displayName,

            email: apiUser.email,

            avatar:
              apiUser.avatar ||
              localTrainer.avatar,
          });

          setIsTrainerAuthenticated(
            true
          );
        } catch (error) {
          console.error(
            'Unable to restore trainer session:',
            error
          );

          localStorage.removeItem(
            'trainer_token'
          );

          sessionStorage.removeItem(
            'trainer_token'
          );

          setIsTrainerAuthenticated(
            false
          );
        } finally {
          setIsCheckingTrainerAuth(
            false
          );
        }
      };

    restoreTrainerSession();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Save student local data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (studentData?.email) {
      saveStudent(studentData);
    }
  }, [studentData]);

  /*
  |--------------------------------------------------------------------------
  | Save trainer local data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (trainerData?.email) {
      saveTrainer(trainerData);
    }
  }, [trainerData]);

  /*
  |--------------------------------------------------------------------------
  | Load student profile
  |--------------------------------------------------------------------------
  */

  const loadStudentProfile =
    async () => {
      const data =
        await getStudentProfile();

      const profile = data.profile;
      const education =
        profile.education;

      setStudentData(
        (currentStudent) => ({
          ...currentStudent,

          fullName: profile.name,

          displayName:
            profile.name,

          email: profile.email,

          avatar:
            profile.avatar ||
            currentStudent?.avatar,

          gender:
            profile.gender || '',

          dob:
            profile.date_of_birth ||
            '',

          nationality:
            profile.nationality || '',

          phone:
            profile.phone || '',

          overview:
            profile.professional_summary ||
            '',

          major:
            education?.major || '',

          program:
            education?.major || '',

          university:
            education?.university ||
            '',

          college:
            education?.faculty ||
            '',

          graduation:
            education
              ?.expected_graduation_date ||
            '',

          location:
            education?.location ||
            '',

          studentCode:
            profile.student_code,

          portfolioCode:
            profile.portfolio_code,

          isVerified:
            profile.is_verified,

          skills:
            profile.skills?.map(
              (skill) => skill.name
            ) || [],

          connections: {
            ...(
              currentStudent
                ?.connections || {}
            ),

            github:
              profile.github_url ||
              '',

            linkedin:
              profile.linkedin_url ||
              '',

            gmail:
              profile.email || '',
          },
        })
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Student login
  |--------------------------------------------------------------------------
  */

  const handleLogin = async (
    email
  ) => {
    const student =
      getOrCreateStudent(email);

    setStudentData(student);

    setIsStudentAuthenticated(
      true
    );

    try {
      await loadStudentProfile();
    } catch (error) {
      console.error(
        'Unable to load student profile:',
        error
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Trainer login
  |--------------------------------------------------------------------------
  */

  const handleTrainerLogin = (
    email
  ) => {
    const trainer =
      getOrCreateTrainer(email);

    setTrainerData(trainer);

    setIsTrainerAuthenticated(
      true
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Trainer profile update
  |--------------------------------------------------------------------------
  */

  const handleTrainerUpdate = (
    profile
  ) => {
    if (!profile?.email) {
      return;
    }

    setTrainerData(profile);

    saveTrainer(profile);
  };

  /*
  |--------------------------------------------------------------------------
  | Student logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    try {
      await studentLogout();
    } catch (error) {
      console.error(
        'Student logout failed:',
        error
      );
    } finally {
      clearCurrentUser();

      setIsStudentAuthenticated(
        false
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Trainer logout
  |--------------------------------------------------------------------------
  */

  const handleTrainerLogout =
    async () => {
      try {
        await trainerLogout();
      } catch (error) {
        console.error(
          'Trainer logout failed:',
          error
        );
      } finally {
        localStorage.removeItem(
          'trainer_token'
        );

        sessionStorage.removeItem(
          'trainer_token'
        );

        clearCurrentTrainer();

        setIsTrainerAuthenticated(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Application
  |--------------------------------------------------------------------------
  */

  return (
    <SettingsProvider>
      <CoursesProvider>
        <CoursesCatalogProvider>
          <DeadlinesProvider>
            <ConversationsProvider>
              <ProjectsProvider>
                <TrainerAssignmentsProvider>
                  <TrainerStudentsProvider>

                    {/* Student notifications */}
                    <NotificationsProvider>

                      {/* Trainer notifications */}
                      <TrainerNotificationsProvider>

                        <AnnouncementsProvider>
                          <CompetitionsProvider>
                            <BrowserRouter>
                              <Routes>

                                {/* Public portfolio */}
                                <Route
                                  path="/portfolio/:portfolioCode"
                                  element={
                                    <PublicPortfolio />
                                  }
                                />

                                {/* Home */}
                                <Route
                                  path="/"
                                  element={
                                    <Homepage />
                                  }
                                />

                                {/* Student login */}
                                <Route
                                  path="/login"
                                  element={
                                    isCheckingStudentAuth
                                      ? null
                                      : isStudentAuthenticated
                                        ? (
                                          <Navigate
                                            to="/student-dashboard"
                                            replace
                                          />
                                        )
                                        : (
                                          <LoginPage
                                            onLogin={
                                              handleLogin
                                            }
                                          />
                                        )
                                  }
                                />

                                {/* Forgot password */}
                                <Route
                                  path="/forgot-password"
                                  element={
                                    isCheckingStudentAuth
                                      ? null
                                      : isStudentAuthenticated
                                        ? (
                                          <Navigate
                                            to="/student-dashboard"
                                            replace
                                          />
                                        )
                                        : (
                                          <ForgotPassword />
                                        )
                                  }
                                />

                                {/* Signup */}
                                <Route
                                  path="/signup"
                                  element={
                                    isCheckingStudentAuth
                                      ? null
                                      : isStudentAuthenticated
                                        ? (
                                          <Navigate
                                            to="/student-dashboard"
                                            replace
                                          />
                                        )
                                        : (
                                          <SignupPage
                                            onStudentSignup={
                                              handleLogin
                                            }
                                            onTrainerSignup={
                                              handleTrainerLogin
                                            }
                                          />
                                        )
                                  }
                                />

                                {/* Trainer login */}
                                <Route
                                  path="/trainer-login"
                                  element={
                                    isCheckingTrainerAuth
                                      ? null
                                      : isTrainerAuthenticated
                                        ? (
                                          <Navigate
                                            to="/trainer-dashboard"
                                            replace
                                          />
                                        )
                                        : (
                                          <TrainerLogin
                                            onLogin={
                                              handleTrainerLogin
                                            }
                                          />
                                        )
                                  }
                                />

                                {/* Trainer dashboard */}
                                <Route
                                  path="/trainer-dashboard/*"
                                  element={
                                    <TrainerProtectedRoute
                                      isAuthenticated={
                                        isTrainerAuthenticated
                                      }
                                      isCheckingAuth={
                                        isCheckingTrainerAuth
                                      }
                                    >
                                      <TrainerDashboard
                                        trainerData={
                                          trainerData
                                        }
                                        onTrainerUpdate={
                                          handleTrainerUpdate
                                        }
                                        onLogout={
                                          handleTrainerLogout
                                        }
                                      />
                                    </TrainerProtectedRoute>
                                  }
                                />

                                {/* Student dashboard */}
                                <Route
                                  path="/student-dashboard/*"
                                  element={
                                    <StudentProtectedRoute
                                      isAuthenticated={
                                        isStudentAuthenticated
                                      }
                                      isCheckingAuth={
                                        isCheckingStudentAuth
                                      }
                                    >
                                      <StudentDashboard
                                        studentData={
                                          studentData
                                        }
                                        setStudentData={
                                          setStudentData
                                        }
                                        onLogout={
                                          handleLogout
                                        }
                                      />
                                    </StudentProtectedRoute>
                                  }
                                />

                                {/* Edit student profile */}
                                <Route
                                  path="/edit-profile"
                                  element={
                                    <StudentProtectedRoute
                                      isAuthenticated={
                                        isStudentAuthenticated
                                      }
                                      isCheckingAuth={
                                        isCheckingStudentAuth
                                      }
                                    >
                                      <EditProfile
                                        student={
                                          studentData
                                        }
                                        onSave={
                                          setStudentData
                                        }
                                      />
                                    </StudentProtectedRoute>
                                  }
                                />

                              </Routes>
                            </BrowserRouter>
                          </CompetitionsProvider>
                        </AnnouncementsProvider>

                      </TrainerNotificationsProvider>
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