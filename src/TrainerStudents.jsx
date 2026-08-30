import { useMemo, useState } from 'react';
import {
  FiAward, FiBriefcase, FiDownload, FiFileText, FiMail,
  FiSearch, FiTrendingUp, FiUsers, FiX,
} from 'react-icons/fi';
import { useTrainerAssignments } from './TrainerAssignmentsContext';
import { useCompetitions } from './CompetitionsContext';
import { useProjects } from './ProjectsContext';
import './TrainerStudents.css';

const PAGE_SIZE = 8;
const INACTIVE_DAYS = 14;
const statusLabels = { 'on-track': 'On track', 'needs-feedback': 'Needs feedback', inactive: 'Inactive' };

const initialsAvatar = (name) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Student')}`;
const daysSince = (timestamp) => (timestamp ? Math.floor((Date.now() - timestamp) / 86400000) : null);
const formatLastActive = (timestamp) => {
  const days = daysSince(timestamp);
  if (days === null) return 'No activity yet';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

/**
 * FIXED: this whole page used to run on TrainerStudentsContext, a fixed
 * mock roster (Maha Alashqar, Omar Fares...) with no connection to any
 * student who actually exists on the platform. Course enrollments turned
 * out not to help either — they're stored per-browser with no student
 * identity attached at all.
 *
 * This roster is now built for real, by scanning three data sources that
 * ARE genuinely shared between student and trainer (same pattern as the
 * messaging and competitions systems already fixed earlier in this
 * project): assignment submissions, competition registrations, and
 * project participation. Any student who has done any of those three
 * things with this trainer shows up here — nothing else is invented.
 */
function useRealStudentRoster() {
  const { submissions: assignmentSubmissions } = useTrainerAssignments();
  const { registrations: competitionRegistrations } = useCompetitions();
  const { projects } = useProjects();

  return useMemo(() => {
    const byEmail = new Map();

    const touch = (rawEmail, rawName) => {
      const email = (rawEmail || '').trim().toLowerCase();
      if (!email) return null;
      if (!byEmail.has(email)) {
        byEmail.set(email, {
          id: email,
          email,
          name: rawName || email.split('@')[0],
          avatar: initialsAvatar(rawName || email),
          assignmentsSubmitted: 0,
          assignmentsGraded: 0,
          assignmentsPending: 0,
          competitionsEntered: 0,
          projectsSubmitted: 0,
          lastActive: null,
        });
      }
      const entry = byEmail.get(email);
      if (rawName && (!entry.name || entry.name === email.split('@')[0])) entry.name = rawName;
      return entry;
    };
    const markActive = (entry, isoTime) => {
      const t = isoTime ? new Date(isoTime).getTime() : NaN;
      if (entry && Number.isFinite(t) && (!entry.lastActive || t > entry.lastActive)) entry.lastActive = t;
    };

    Object.values(assignmentSubmissions || {}).flat().forEach((sub) => {
      const entry = touch(sub.studentEmail, sub.studentName);
      if (!entry) return;
      entry.assignmentsSubmitted += 1;
      if (sub.status === 'graded') entry.assignmentsGraded += 1;
      else entry.assignmentsPending += 1;
      markActive(entry, sub.submittedAt);
    });

    (competitionRegistrations || []).forEach((reg) => {
      const entry = touch(reg.studentEmail, reg.studentName);
      if (!entry) return;
      entry.competitionsEntered += 1;
      markActive(entry, reg.createdAt);
    });

    (projects || []).filter((project) => !project.deletedAt).forEach((project) => {
      const ownerEntry = touch(project.studentEmail, project.studentName || project.student);
      if (ownerEntry) { ownerEntry.projectsSubmitted += 1; markActive(ownerEntry, project.updatedAt || project.createdAt); }
      (project.team || []).forEach((member) => {
        const memberEmail = typeof member === 'string' ? '' : member.email;
        const memberName = typeof member === 'string' ? member : member.name;
        if (!memberEmail) return;
        const teamEntry = touch(memberEmail, memberName);
        if (teamEntry) { teamEntry.projectsSubmitted += 1; markActive(teamEntry, project.updatedAt || project.createdAt); }
      });
    });

    return [...byEmail.values()].map((entry) => {
      const inactive = entry.lastActive ? daysSince(entry.lastActive) > INACTIVE_DAYS : true;
      const status = entry.assignmentsPending > 0 ? 'needs-feedback' : inactive ? 'inactive' : 'on-track';
      return { ...entry, status };
    }).sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
  }, [assignmentSubmissions, competitionRegistrations, projects]);
}

export default function TrainerStudents({ onOpenMessages }) {
  const roster = useRealStudentRoster();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const needsAttention = roster.filter((student) => student.status === 'needs-feedback');
  const onTrackCount = roster.filter((student) => student.status === 'on-track').length;
  const totalPending = roster.reduce((sum, student) => sum + student.assignmentsPending, 0);

  const filtered = useMemo(() => roster.filter((student) => {
    const text = `${student.name} ${student.email}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (statusFilter === 'all' || student.status === statusFilter);
  }), [roster, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage = (setter, value) => { setter(value); setPage(1); };

  const exportRoster = () => {
    const rows = [
      ['Name', 'Email', 'Assignments submitted', 'Assignments graded', 'Awaiting grading', 'Competitions entered', 'Projects submitted', 'Last active', 'Status'],
      ...filtered.map((s) => [s.name, s.email, s.assignmentsSubmitted, s.assignmentsGraded, s.assignmentsPending, s.competitionsEntered, s.projectsSubmitted, formatLastActive(s.lastActive), statusLabels[s.status]]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'compass-students.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="trainer-students-page">
      <header className="ts-title-row">
        <div>
          <span>STUDENT MANAGEMENT</span>
          <h1>Students</h1>
          <p>Everyone who has submitted an assignment, joined a competition, or entered a project with you.</p>
        </div>
        <div><button onClick={exportRoster}><FiDownload /> Export roster</button></div>
      </header>

      <section className="ts-stats">
        <article><FiUsers /><div><strong>{roster.length}</strong><b>Total students</b><small>Active across your work</small></div></article>
        <article className="green"><FiTrendingUp /><div><strong>{onTrackCount}</strong><b>On track</b><small>{roster.length ? Math.round((onTrackCount / roster.length) * 100) : 0}% of students</small></div></article>
        <article className="orange"><FiFileText /><div><strong>{totalPending}</strong><b>Awaiting grading</b><small>Across {needsAttention.length} students</small></div></article>
        <article><FiAward /><div><strong>{roster.reduce((sum, s) => sum + s.competitionsEntered, 0)}</strong><b>Competition entries</b><small>Total registrations</small></div></article>
      </section>

      <div className="ts-layout">
        <section className="ts-table-card">
          <div className="ts-filters">
            <label><FiSearch /><input value={query} onChange={(e) => resetPage(setQuery, e.target.value)} placeholder="Search by name or email" /></label>
          </div>
          <div className="ts-tabs">
            {[['all', 'All students'], ['needs-feedback', 'Needs grading'], ['on-track', 'On track'], ['inactive', 'Inactive']].map(([value, label]) => (
              <button key={value} className={statusFilter === value ? 'active' : ''} onClick={() => resetPage(setStatusFilter, value)}>{label}</button>
            ))}
          </div>
          <div className="ts-table-scroll">
            <div className="ts-table-head"><span>Student</span><span>Activity</span><span>Last active</span><span>Status</span><span>Actions</span></div>
            {shown.map((student) => (
              <article className="ts-student-row" key={student.id}>
                <div className="ts-person"><img src={student.avatar} alt={student.name} /><span><strong>{student.name}</strong><small>{student.email}</small></span></div>
                <div className="ts-activity">
                  <span title="Assignments graded / submitted"><FiFileText /> {student.assignmentsGraded}/{student.assignmentsSubmitted}</span>
                  <span title="Competitions entered"><FiAward /> {student.competitionsEntered}</span>
                  <span title="Projects submitted"><FiBriefcase /> {student.projectsSubmitted}</span>
                </div>
                <span className="ts-last-active">{formatLastActive(student.lastActive)}</span>
                <b className={`ts-status ${student.status}`}>{statusLabels[student.status]}</b>
                <div className="ts-actions">
                  <button onClick={() => setSelected(student)}>View profile</button>
                  <button aria-label="Message student" onClick={onOpenMessages}><FiMail /></button>
                </div>
              </article>
            ))}
            {!shown.length && (
              <div className="ts-empty">
                {roster.length ? 'No students match these filters.' : 'No student activity yet — students will appear here once they submit an assignment, join a competition, or enter a project with you.'}
              </div>
            )}
          </div>
          <footer className="ts-pagination">
            <span>Showing {shown.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} students</span>
            <div>
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((number) => (
                <button className={page === number ? 'active' : ''} key={number} onClick={() => setPage(number)}>{number}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</button>
            </div>
          </footer>
        </section>

        <aside className="ts-side">
          <section>
            <header><h2>Needs grading</h2><button onClick={() => resetPage(setStatusFilter, 'needs-feedback')}>Review list →</button></header>
            {needsAttention.slice(0, 4).map((student) => (
              <article key={student.id}>
                <span>{student.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span>
                <div><strong>{student.name}</strong><small>{student.assignmentsPending} submission{student.assignmentsPending === 1 ? '' : 's'} awaiting grading</small></div>
                <b>{statusLabels[student.status]}</b>
              </article>
            ))}
            {!needsAttention.length && <p className="ts-side-empty">Nothing waiting on you right now.</p>}
          </section>
        </aside>
      </div>

      {selected && (
        <div className="ts-modal" onMouseDown={() => setSelected(null)}>
          <section onMouseDown={(e) => e.stopPropagation()}>
            <button className="ts-close" onClick={() => setSelected(null)}><FiX /></button>
            <img src={selected.avatar} alt={selected.name} />
            <h2>{selected.name}</h2>
            <p>{selected.email}</p>
            <dl>
              <div><dt><FiFileText /> Assignments</dt><dd>{selected.assignmentsGraded}/{selected.assignmentsSubmitted} graded ({selected.assignmentsPending} pending)</dd></div>
              <div><dt><FiAward /> Competitions</dt><dd>{selected.competitionsEntered} entered</dd></div>
              <div><dt><FiBriefcase /> Projects</dt><dd>{selected.projectsSubmitted} submitted</dd></div>
              <div><dt>Last active</dt><dd>{formatLastActive(selected.lastActive)}</dd></div>
            </dl>
            <button className="ts-primary" onClick={onOpenMessages}><FiMail /> Send message</button>
          </section>
        </div>
      )}
    </div>
  );
}
