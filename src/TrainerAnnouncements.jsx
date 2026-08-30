import { useMemo, useState } from 'react';
import { FiArchive, FiAward, FiBell, FiBriefcase, FiCalendar, FiCopy, FiEdit2, FiFileText, FiPlus, FiSearch, FiUsers, FiX } from 'react-icons/fi';
import { ANNOUNCEMENT_TYPES, useAnnouncements } from './AnnouncementsContext';
import { useTrainerStudents } from './TrainerStudentsContext';
import { useCoursesCatalog } from './CoursesCatalogContext';
import './TrainerAnnouncements.css';

const emptyForm = {
  title: '', content: '', type: 'General', audienceType: 'all', audienceValue: '',
  link: '', attachment: null, publishAt: '',
};

const labels = { published: 'Published', scheduled: 'Scheduled', draft: 'Draft' };
const TYPE_ICONS = { Policy: FiFileText, Competition: FiAward, 'Faculty instructions': FiBriefcase, General: FiBell };

// Reads the file so the attachment can actually be reopened later, instead
// of only remembering its name and size. Large files (>5MB) keep just the
// metadata — the UI is honest about that instead of pretending to preview.
const readAttachment = (file) => new Promise((resolve) => {
  const base = { name: file.name, size: `${Math.ceil(file.size / 1024)} KB`, type: file.type, dataUrl: '' };
  if (file.size > 5 * 1024 * 1024) { resolve(base); return; }
  const reader = new FileReader();
  reader.onerror = () => resolve(base);
  reader.onload = () => resolve({ ...base, dataUrl: String(reader.result || '') });
  reader.readAsDataURL(file);
});

export default function TrainerAnnouncements({ trainerData }) {
  const api = useAnnouncements();
  const { roster } = useTrainerStudents();
  const { courses } = useCoursesCatalog();
  const myCourses = useMemo(
    () => courses.filter((c) => c.instructor === trainerData?.displayName || c.createdByTrainer),
    [courses, trainerData?.displayName]
  );

  const [selectedId, setSelectedId] = useState(api.getTrainerAnnouncements()[0]?.id || null);
  const [filter, setFilter] = useState('all');
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  // FIXED: "Selected students" audience used to just be a free-text box —
  // no real connection to the trainer's actual student roster. This tracks
  // real student ids from a real checklist below.
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [formError, setFormError] = useState('');

  const list = useMemo(() => api.getTrainerAnnouncements().filter((item) => {
    const matchesStatus = filter === 'all' || item.status === filter;
    const matchesType = type === 'all' || item.type === type;
    const haystack = `${item.title} ${item.content} ${item.audienceLabel}`.toLowerCase();
    return matchesStatus && matchesType && haystack.includes(query.toLowerCase());
  }), [api, filter, query, type]);

  // FIXED: this used to look the selected item up in the *full* unfiltered
  // announcement list, so changing a filter could leave the preview
  // showing an announcement that wasn't even present in the visible list
  // on the left. It now only ever resolves against `list` (the filtered
  // results), so the preview always matches what's actually on screen.
  const selected = list.find((item) => item.id === selectedId) || list[0] || null;
  const stats = selected ? api.getAnnouncementDeliveryStats(selected.id) : { recipients: 0, views: 0 };

  const openNew = () => { setEditingId(null); setForm(emptyForm); setSelectedStudentIds([]); setStudentQuery(''); setFormError(''); setEditorOpen(true); };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...emptyForm, ...item, publishAt: item.publishAt?.slice(0, 16) || '' });
    setSelectedStudentIds(Array.isArray(item.audienceStudentIds) ? item.audienceStudentIds : []);
    setStudentQuery('');
    setFormError('');
    setEditorOpen(true);
  };

  const toggleStudent = (id) => {
    setSelectedStudentIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  };

  const filteredRoster = useMemo(
    () => roster.filter((student) => student.name.toLowerCase().includes(studentQuery.toLowerCase())),
    [roster, studentQuery]
  );

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const asset = await readAttachment(file);
    setForm((current) => ({ ...current, attachment: asset }));
  };

  // FIXED: recipient counts are now only ever real numbers computed from
  // actual data — the full roster for "All students", or the exact
  // checklist selection for "Selected students". For audience types this
  // page can't verify against real data yet (course/major/faculty), no
  // number is claimed at all rather than guessing.
  const computeRecipients = () => {
    if (form.audienceType === 'all') return roster.length;
    if (form.audienceType === 'students') return selectedStudentIds.length;
    return undefined;
  };

  const save = (mode) => {
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and content are required.');
      return;
    }
    if (['course', 'major'].includes(form.audienceType) && !form.audienceValue.trim()) {
      setFormError('Please specify the audience for this announcement.');
      return;
    }
    if (form.audienceType === 'students' && !selectedStudentIds.length) {
      setFormError('Select at least one student.');
      return;
    }
    if (mode === 'schedule' && !form.publishAt) {
      setFormError('Choose a schedule date and time first.');
      return;
    }
    if (mode === 'publish' && !window.confirm('Publish this announcement now? Students in the selected audience will be notified immediately.')) {
      return;
    }
    setFormError('');

    const selectedNames = selectedStudentIds
      .map((id) => roster.find((student) => student.id === id)?.name)
      .filter(Boolean);
    const audienceLabel = form.audienceType === 'all'
      ? 'All students'
      : form.audienceType === 'students'
        ? (selectedNames.length ? selectedNames.join(', ') : 'Selected students')
        : (form.audienceValue || form.audienceType);
    const data = {
      ...form,
      audienceLabel,
      audienceStudentIds: form.audienceType === 'students' ? selectedStudentIds : undefined,
      author: trainerData?.displayName || 'Trainer',
    };
    let id = editingId;
    if (id) api.updateAnnouncement(id, data);
    else id = api.createAnnouncement(data).id;
    if (mode === 'publish') api.publishAnnouncement(id, { recipients: computeRecipients() });
    if (mode === 'schedule' && form.publishAt) api.scheduleAnnouncement(id, new Date(form.publishAt).toISOString());
    // FIXED: without this, saving or duplicating while a status/type filter
    // was active could make the item you just created disappear from the
    // list — it existed, but nothing on screen showed it, so "Duplicate"
    // or "Save draft" looked like it silently did nothing.
    setFilter('all'); setType('all');
    setSelectedId(id); setEditorOpen(false);
  };

  const handleDuplicate = () => {
    if (!selected) return;
    const copy = api.duplicateAnnouncement(selected.id);
    if (!copy) return;
    setFilter('all'); setType('all');
    setSelectedId(copy.id);
  };

  return (
    <div className="ta-page">
      <header className="ta-heading">
        <div><span>COMMUNICATION CENTER</span><h1>Announcements</h1><p>Publish important updates and notify the right students.</p></div>
        <button onClick={openNew}><FiPlus /> New announcement</button>
      </header>

      <section className="ta-toolbar">
        <nav>{['all', 'published', 'scheduled', 'draft'].map((value) => <button className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} key={value}>{value === 'all' ? 'All' : labels[value]}</button>)}</nav>
        <label><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search announcements" /></label>
        <select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option>{ANNOUNCEMENT_TYPES.map((value) => <option key={value}>{value}</option>)}</select>
      </section>

      <div className="ta-layout">
        <section className="ta-list">
          {list.map((item) => {
            const TypeIcon = TYPE_ICONS[item.type] || FiBell;
            return (
              <button key={item.id} className={`ta-row ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)}>
                <i><TypeIcon /></i>
                <span><small className={`ta-type ${item.type.toLowerCase().replace(' ', '-')}`}>{item.type}</small><strong>{item.title}</strong><em><FiUsers /> {item.audienceLabel}</em></span>
                <b><time>{new Date(item.publishAt || item.publishedAt || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time><small className={`ta-status ${item.status}`}>{labels[item.status]}</small></b>
              </button>
            );
          })}
          {!list.length && <div className="ta-empty">No announcements match the selected filters.</div>}
        </section>

        <aside className="ta-preview">
          {selected ? <>
            <small className={`ta-type ${selected.type.toLowerCase().replace(' ', '-')}`}>{selected.type}</small>
            <h2>{selected.title}</h2>
            <div className="ta-preview-meta"><span className={`ta-status ${selected.status}`}>{labels[selected.status]}</span><span><FiUsers /> {selected.audienceLabel}</span></div>
            <p className="ta-date"><FiCalendar /> {selected.status === 'scheduled' ? 'Scheduled' : 'Published'} on {new Date(selected.publishAt || selected.publishedAt || selected.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <div className="ta-copy">{selected.content.split('\n').map((line, index) => <p key={index}>{line || <br />}</p>)}</div>
            {selected.attachment && (
              selected.attachment.dataUrl ? (
                <a className="ta-file" href={selected.attachment.dataUrl} download={selected.attachment.name}>
                  <FiFileText /><span><strong>{selected.attachment.name}</strong><small>{selected.attachment.size} · Click to download</small></span>
                </a>
              ) : (
                <div className="ta-file"><FiFileText /><span><strong>{selected.attachment.name}</strong><small>{selected.attachment.size}</small></span></div>
              )
            )}
            {selected.link && <a className="ta-link" href={selected.link}>Open related page</a>}
            {selected.status === 'published' && (
              <div className="ta-delivery">
                <FiBell />
                <span>
                  <strong>Notification sent</strong>
                  <small>{stats.recipients > 0 ? `${stats.recipients} recipients · ` : ''}{stats.views} viewed</small>
                </span>
              </div>
            )}
            <div className="ta-actions"><button onClick={() => openEdit(selected)}><FiEdit2 /> Edit</button><button onClick={handleDuplicate}><FiCopy /> Duplicate</button></div>
            <button className="ta-archive" onClick={() => window.confirm('Archive this announcement? Reading records will be preserved.') && api.archiveAnnouncement(selected.id)}><FiArchive /> Archive</button>
          </> : <div className="ta-empty">Select an announcement to preview it.</div>}
        </aside>
      </div>

      {editorOpen && <div className="ta-modal" role="dialog" aria-modal="true">
        <form onSubmit={(event) => { event.preventDefault(); save('draft'); }}>
          <header><div><h2>{editingId ? 'Edit announcement' : 'New announcement'}</h2><p>Choose the message, audience, and publishing option.</p></div><button type="button" onClick={() => setEditorOpen(false)}><FiX /></button></header>
          <div className="ta-form-grid">
            <label className="full">Title *<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
            <label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{ANNOUNCEMENT_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Audience<select value={form.audienceType} onChange={(event) => setForm({ ...form, audienceType: event.target.value, audienceValue: '' })}><option value="all">All students</option><option value="faculty">Faculty</option><option value="major">Major</option><option value="course">Course</option><option value="students">Selected students</option></select></label>

            {form.audienceType === 'course' && (
              <label className="full">Course *
                <select value={form.audienceValue} onChange={(event) => setForm({ ...form, audienceValue: event.target.value })} required>
                  <option value="">Select one of your courses</option>
                  {myCourses.map((course) => <option key={course.id} value={course.title}>{course.title}</option>)}
                </select>
              </label>
            )}
            {form.audienceType === 'major' && (
              <label className="full">Major *<input value={form.audienceValue} onChange={(event) => setForm({ ...form, audienceValue: event.target.value })} placeholder="e.g. Computer Engineering" required /></label>
            )}
            {form.audienceType === 'faculty' && (
              <label className="full">Faculty note<input value={form.audienceValue} onChange={(event) => setForm({ ...form, audienceValue: event.target.value })} placeholder="e.g. Engineering and Information Technology" /></label>
            )}
            {form.audienceType === 'students' && (
              <div className="full ta-student-picker">
                <span>Select students * ({selectedStudentIds.length} selected)</span>
                <label className="ta-student-search"><FiSearch /><input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Search your students" /></label>
                <div className="ta-student-list">
                  {filteredRoster.map((student) => (
                    <label key={student.id}>
                      <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} />
                      {student.name}
                    </label>
                  ))}
                  {!filteredRoster.length && <p className="ta-student-empty">No students match this search.</p>}
                </div>
              </div>
            )}

            <label className="full">Content *<textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required /></label>
            <label>Related link<input value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} placeholder="/student-dashboard/competitions" /></label>
            <label>Schedule time<input type="datetime-local" value={form.publishAt} onChange={(event) => setForm({ ...form, publishAt: event.target.value })} /></label>
            <label className="full">Attachment<input type="file" onChange={handleAttachmentChange} />{form.attachment && <small className="ta-attachment-hint">{form.attachment.name} ({form.attachment.size})</small>}</label>
          </div>
          {formError && <p className="ta-form-error">{formError}</p>}
          <footer><button type="button" className="ghost" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" className="ghost">Save draft</button><button type="button" className="schedule" disabled={!form.publishAt} onClick={() => save('schedule')}>Schedule</button><button type="button" className="publish" onClick={() => save('publish')}>Publish now</button></footer>
        </form>
      </div>}
    </div>
  );
}
