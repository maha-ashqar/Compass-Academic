import { useMemo, useState } from 'react';
import { FiDownload, FiFilter, FiMail, FiMoreVertical, FiPlus, FiSearch, FiTrendingUp, FiUserPlus, FiUsers, FiX } from 'react-icons/fi';
import { useTrainerStudents } from './TrainerStudentsContext';
import './TrainerStudents.css';

const PAGE_SIZE = 6;
const labels = { 'on-track': 'On track', 'needs-feedback': 'Needs feedback', inactive: 'Inactive', 'late-tasks': '2 late tasks', excellent: 'Excellent', 'needs-attention': 'Needs attention' };
const emptyStudent = { name: '', email: '', studentId: '', courseTitle: '', progress: 0 };

export default function TrainerStudents({ onOpenMessages }) {
  const { roster, addStudent, toggleStudentAccess } = useTrainerStudents();
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [status, setStatus] = useState('all');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyStudent);

  const courses = [...new Set(roster.map((student) => student.courseTitle).filter(Boolean))];
  const needsAttention = roster.filter((student) => ['inactive', 'late-tasks', 'needs-feedback', 'needs-attention'].includes(student.status));
  const onTrack = roster.filter((student) => ['on-track', 'excellent'].includes(student.status)).length;
  const newThisMonth = roster.filter((student) => new Date(student.joinedAt).getMonth() === new Date().getMonth()).length;

  const filtered = useMemo(() => roster.filter((student) => {
    const text = `${student.name} ${student.email} ${student.studentId}`.toLowerCase();
    const matchesTab = tab === 'all' || (tab === 'on-track' && ['on-track', 'excellent'].includes(student.status)) || (tab === 'attention' && needsAttention.some((item) => item.id === student.id)) || (tab === 'inactive' && student.status === 'inactive');
    return text.includes(query.toLowerCase()) && (course === 'all' || student.courseTitle === course) && (status === 'all' || student.status === status) && matchesTab;
  }), [roster, query, course, status, tab, needsAttention]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage = (setter, value) => { setter(value); setPage(1); };

  const exportRoster = () => {
    const rows = [['Student ID', 'Name', 'Email', 'Course', 'Progress', 'Status', 'Access'], ...filtered.map((s) => [s.studentId, s.name, s.email, s.courseTitle, `${s.progress}%`, labels[s.status] || s.status, s.access])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'compass-students.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const submitStudent = (event) => {
    event.preventDefault();
    addStudent({ ...form, progress: Number(form.progress), completedSubmissions: 0, totalSubmissions: 0, status: 'on-track', access: 'active' });
    setForm(emptyStudent); setAddOpen(false);
  };

  return (
    <div className="trainer-students-page">
      <header className="ts-title-row"><div><span>STUDENT MANAGEMENT</span><h1>Students</h1><p>Monitor progress, support learning, and manage student access.</p></div><div><button className="ts-primary" onClick={() => setAddOpen(true)}><FiPlus /> Add student</button><button onClick={exportRoster}><FiDownload /> Export roster</button></div></header>

      <section className="ts-stats">
        <article><FiUsers /><div><strong>{roster.length}</strong><b>Total students</b><small>Across {courses.length} active courses</small></div></article>
        <article className="green"><FiTrendingUp /><div><strong>{onTrack}</strong><b>On track</b><small>{roster.length ? Math.round(onTrack / roster.length * 100) : 0}% of students</small></div></article>
        <article className="orange"><FiFilter /><div><strong>{needsAttention.length}</strong><b>Need attention</b><small>Late work or inactivity</small></div></article>
        <article><FiUserPlus /><div><strong>{newThisMonth}</strong><b>New this month</b><small>Recently enrolled</small></div></article>
      </section>

      <div className="ts-layout">
        <section className="ts-table-card">
          <div className="ts-filters"><label><FiSearch /><input value={query} onChange={(e) => resetPage(setQuery, e.target.value)} placeholder="Search by name, email, or student ID" /></label><div><small>Course</small><select value={course} onChange={(e) => resetPage(setCourse, e.target.value)}><option value="all">All courses</option>{courses.map((item) => <option key={item}>{item}</option>)}</select></div><div><small>Status</small><select value={status} onChange={(e) => resetPage(setStatus, e.target.value)}><option value="all">All statuses</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
          <div className="ts-tabs">{[['all','All students'],['on-track','On track'],['attention','Need attention'],['inactive','Inactive']].map(([value,label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => resetPage(setTab, value)}>{label}</button>)}</div>
          <div className="ts-table-scroll"><div className="ts-table-head"><span>Student</span><span>Course</span><span>Progress</span><span>Last active</span><span>Submissions</span><span>Status</span><span>Access</span><span>Actions</span></div>
            {shown.map((student) => <article className="ts-student-row" key={student.id}><div className="ts-person"><img src={student.avatar} alt={student.name}/><span><strong>{student.name}</strong><small>{student.email}</small><small>ID: {student.studentId}</small></span></div><span>{student.courseTitle}</span><div className="ts-progress"><b>{student.progress}%</b><i><em style={{ width: `${student.progress}%` }}/></i></div><span>{student.lastActive}</span><span>{student.completedSubmissions} / {student.totalSubmissions}</span><b className={`ts-status ${student.status}`}>{labels[student.status] || student.status}</b><button className={`ts-access ${student.access}`} onClick={() => toggleStudentAccess(student.id)}>{student.access === 'active' ? 'Active' : 'Limited'}</button><div className="ts-actions"><button onClick={() => setSelected(student)}>View profile</button><button aria-label="Message student" onClick={onOpenMessages}><FiMail /></button><FiMoreVertical /></div></article>)}
            {!shown.length && <div className="ts-empty">No students match these filters.</div>}
          </div>
          <footer className="ts-pagination"><span>Showing {shown.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} students</span><div><button disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>{Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((number) => <button className={page === number ? 'active' : ''} key={number} onClick={() => setPage(number)}>{number}</button>)}<button disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</button></div></footer>
        </section>

        <aside className="ts-side"><section><header><h2>Students needing attention</h2><button onClick={() => resetPage(setTab, 'attention')}>Review list →</button></header>{needsAttention.slice(0,3).map((student) => <article key={student.id}><span>{student.name.split(' ').map((word) => word[0]).slice(0,2).join('')}</span><div><strong>{student.name}</strong><small>{student.feedback || `${student.progress}% course progress`}</small></div><b>{labels[student.status]}</b></article>)}</section><section><h2>Course distribution</h2>{courses.slice(0,4).map((item) => { const count = roster.filter((student) => student.courseTitle === item).length; const percent = Math.round(count / Math.max(1, roster.length) * 100); return <article className="ts-course" key={item}><div><strong>{item}</strong><small>{count} students</small></div><i><em style={{ width: `${percent}%` }}/></i><b>{percent}%</b></article>; })}</section></aside>
      </div>

      {selected && <div className="ts-modal" onMouseDown={() => setSelected(null)}><section onMouseDown={(e) => e.stopPropagation()}><button className="ts-close" onClick={() => setSelected(null)}><FiX /></button><img src={selected.avatar} alt={selected.name}/><h2>{selected.name}</h2><p>{selected.email} · {selected.studentId}</p><dl><div><dt>Course</dt><dd>{selected.courseTitle}</dd></div><div><dt>Progress</dt><dd>{selected.progress}%</dd></div><div><dt>Submissions</dt><dd>{selected.completedSubmissions}/{selected.totalSubmissions}</dd></div><div><dt>Access</dt><dd>{selected.access}</dd></div></dl><button className="ts-primary" onClick={onOpenMessages}><FiMail /> Send message</button></section></div>}
      {addOpen && <div className="ts-modal" onMouseDown={() => setAddOpen(false)}><form onSubmit={submitStudent} onMouseDown={(e) => e.stopPropagation()}><button type="button" className="ts-close" onClick={() => setAddOpen(false)}><FiX /></button><h2>Add student</h2><p>Enroll a student and grant course access.</p><label>Full name<input required value={form.name} onChange={(e) => setForm({...form,name:e.target.value})}/></label><label>Email<input required type="email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})}/></label><label>Student ID<input required value={form.studentId} onChange={(e) => setForm({...form,studentId:e.target.value})}/></label><label>Course<select required value={form.courseTitle} onChange={(e) => setForm({...form,courseTitle:e.target.value})}><option value="">Select course</option>{courses.map((item) => <option key={item}>{item}</option>)}</select></label><button className="ts-primary" type="submit"><FiPlus /> Add student</button></form></div>}
    </div>
  );}