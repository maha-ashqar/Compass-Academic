import { useState, useMemo } from 'react';
import { useCourses } from './CoursesContext';
import { useCompetitions } from './CompetitionsContext';
import { badgesData } from './achievementsData';
import './Achievements.css';

const Achievements = ({ studentData }) => {
  const { myCourses, getCourseProgress, isLessonComplete, isAssignmentSubmitted } = useCourses();
  const { registeredIds } = useCompetitions();
  const [viewingCertificate, setViewingCertificate] = useState(null);

  // ============ حساب التقدم الحقيقي لكل كورس ============
  const coursesWithProgress = useMemo(() => {
    return myCourses.map((course) => {
      const totalLessons = (course.modules || []).reduce((sum, m) => sum + m.lessons.length, 0);
      const progress = getCourseProgress(course.id, totalLessons);
      const completedLessonsCount = (course.modules || [])
        .flatMap((m) => m.lessons)
        .filter((l) => isLessonComplete(course.id, l.id)).length;
      return { ...course, progress, totalLessons, completedLessonsCount };
    });
  }, [myCourses, getCourseProgress, isLessonComplete]);

  // ============ عدد الأسايمنتس المسلّمة فعليًا ============
  const submittedAssignmentsCount = useMemo(() => {
    let count = 0;
    myCourses.forEach((course) => {
      (course.assignments || []).forEach((a) => {
        if (isAssignmentSubmitted(a.id)) count += 1;
      });
    });
    return count;
  }, [myCourses, isAssignmentSubmitted]);

  // ============ الكورسات المكتملة 100% (تولّد شهادة) ============
  const completedCourses = coursesWithProgress.filter((c) => c.progress === 100);

  // ============ عدد الكورسات اللي فيها درس واحد مكتمل على الأقل ============
  const coursesWithAtLeastOneLesson = coursesWithProgress.filter((c) => c.completedLessonsCount > 0).length;

  const totalLessonsCompletedAcrossAll = coursesWithProgress.reduce(
    (sum, c) => sum + c.completedLessonsCount, 0
  );

  const maxProgress = coursesWithProgress.reduce((max, c) => Math.max(max, c.progress), 0);

  // ============ منطق فتح/تقفيل كل شارة + نسبة التقدم نحوها ============
  const evaluateBadge = (badgeId) => {
    switch (badgeId) {
      case 'getting-started':
        return { unlocked: myCourses.length >= 1, current: myCourses.length, target: 1 };
      case 'first-lesson':
        return { unlocked: totalLessonsCompletedAcrossAll >= 1, current: totalLessonsCompletedAcrossAll, target: 1 };
      case 'halfway-there':
        return { unlocked: maxProgress >= 50, current: maxProgress, target: 50 };
      case 'course-graduate':
        return { unlocked: completedCourses.length >= 1, current: completedCourses.length, target: 1 };
      case 'multi-track':
        return { unlocked: myCourses.length >= 3, current: myCourses.length, target: 3 };
      case 'knowledge-seeker':
        return { unlocked: coursesWithAtLeastOneLesson >= 3, current: coursesWithAtLeastOneLesson, target: 3 };
      case 'assignment-ace':
        return { unlocked: submittedAssignmentsCount >= 5, current: submittedAssignmentsCount, target: 5 };
      case 'competitor':
        return { unlocked: registeredIds.length >= 1, current: registeredIds.length, target: 1 };
      default:
        return { unlocked: false, current: 0, target: 1 };
    }
  };

  const badgesWithStatus = badgesData.map((b) => ({ ...b, ...evaluateBadge(b.id) }));
  const unlockedCount = badgesWithStatus.filter((b) => b.unlocked).length;

  // ============ عرض شهادة كورس مكتمل ============
  if (viewingCertificate) {
    const course = viewingCertificate;
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
      <div className="ach-container">
        <button className="ach-back-button" onClick={() => setViewingCertificate(null)}>
          ‹ Back to Achievements
        </button>

        <div className="ach-certificate-wrap">
          <div className="ach-certificate">
            <div className="ach-cert-border">
              <span className="ach-cert-brand">COMPASS ACADEMY</span>
              <p className="ach-cert-subtitle">Certificate of Completion</p>

              <p className="ach-cert-presented">This certificate is proudly presented to</p>
              <h2 className="ach-cert-name">{studentData?.displayName || 'Student'}</h2>

              <p className="ach-cert-body">
                for successfully completing the course
              </p>
              <h3 className="ach-cert-course">{course.category}</h3>
              <p className="ach-cert-course-title">{course.title}</p>

              <div className="ach-cert-footer">
                <div className="ach-cert-signature">
                  <span className="ach-cert-line" />
                  <span>{course.instructor}</span>
                  <span className="ach-cert-role">Instructor</span>
                </div>
                <div className="ach-cert-date">
                  <span className="ach-cert-line" />
                  <span>{today}</span>
                  <span className="ach-cert-role">Date Issued</span>
                </div>
              </div>
            </div>
          </div>

          <button className="ach-print-btn" onClick={() => window.print()}>
            🖨 Print Certificate
          </button>
        </div>
      </div>
    );
  }

  // ============ الصفحة الرئيسية ============
  return (
    <div className="ach-container">
      <div className="ach-page-header">
        <div>
          <h1>Achievements</h1>
          <p>Track your milestones, badges, and certificates as you progress at Compass Academy.</p>
        </div>
        <div className="ach-summary-badge">
          <span className="ach-summary-count">{unlockedCount}</span>
          <span className="ach-summary-label">of {badgesData.length} unlocked</span>
        </div>
      </div>

      <div className="ach-badges-grid">
        {badgesWithStatus.map((badge) => (
          <div key={badge.id} className={`ach-badge-card ${badge.tier} ${badge.unlocked ? 'unlocked' : 'locked'}`}>
            <div className="ach-badge-icon">{badge.unlocked ? badge.icon : '🔒'}</div>
            <h4 className="ach-badge-title">{badge.title}</h4>
            <p className="ach-badge-desc">{badge.description}</p>

            {!badge.unlocked && badge.target > 1 && (
              <div className="ach-badge-progress">
                <div className="ach-badge-progress-bg">
                  <div
                    className="ach-badge-progress-fill"
                    style={{ width: `${Math.min(100, (badge.current / badge.target) * 100)}%` }}
                  />
                </div>
                <span className="ach-badge-progress-text">
                  {badge.current} / {badge.target}
                </span>
              </div>
            )}

            {badge.unlocked && <span className="ach-badge-unlocked-tag">✓ Unlocked</span>}
          </div>
        ))}
      </div>

      <div className="ach-certificates-section">
        <div className="ach-section-header">
          <h3>My Certificates</h3>
          <span className="ach-cert-count">{completedCourses.length} earned</span>
        </div>

        {completedCourses.length === 0 ? (
          <div className="ach-empty">
            <div className="ach-empty-icon">📜</div>
            <h3>No certificates yet</h3>
            <p>Complete 100% of any course to earn your first certificate.</p>
          </div>
        ) : (
          <div className="ach-certificates-grid">
            {completedCourses.map((course) => (
              <div key={course.id} className="ach-certificate-card">
                <div className="ach-certificate-icon">🏅</div>
                <div className="ach-certificate-info">
                  <span className="ach-certificate-category">{course.category}</span>
                  <h4>{course.title}</h4>
                  <p>{course.instructor}</p>
                </div>
                <button className="ach-view-cert-btn" onClick={() => setViewingCertificate(course)}>
                  View Certificate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;