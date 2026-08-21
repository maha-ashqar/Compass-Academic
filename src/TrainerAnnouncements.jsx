import { useMemo, useState } from 'react';
import { FiArchive, FiBell, FiCalendar, FiCopy, FiEdit2, FiFileText, FiPlus, FiSearch, FiUsers, FiX } from 'react-icons/fi';
import { ANNOUNCEMENT_TYPES, useAnnouncements } from './AnnouncementsContext';
import './TrainerAnnouncements.css';

const emptyForm = {
  title: '', content: '', type: 'General', audienceType: 'all', audienceValue: '',
  link: '', attachment: null, publishAt: '',
};

const labels = { published: 'Published', scheduled: 'Scheduled', draft: 'Draft' };

export default function TrainerAnnouncements({ trainerData }) {
  const api = useAnnouncements();
  const [selectedId, setSelectedId] = useState(api.getTrainerAnnouncements()[0]?.id || null);
  const [filter, setFilter] = useState('all');
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const list = useMemo(() => api.getTrainerAnnouncements().filter((item) => {
    const matchesStatus = filter === 'all' || item.status === filter;
    const matchesType = type === 'all' || item.type === type;
    const haystack = `${item.title} ${item.content} ${item.audienceLabel}`.toLowerCase();
    return matchesStatus && matchesType && haystack.includes(query.toLowerCase());
  }), [api, filter, query, type]);

  const selected = api.getAnnouncementById(selectedId) || list[0] || null;
  const stats = selected ? api.getAnnouncementDeliveryStats(selected.id) : { recipients: 0, views: 0 };

  const openNew = () => { setEditingId(null); setForm(emptyForm); setEditorOpen(true); };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...emptyForm, ...item, publishAt: item.publishAt?.slice(0, 16) || '' });
    setEditorOpen(true);
  };

  const save = (mode) => {
    if (!form.title.trim() || !form.content.trim()) return;
    const audienceLabel = form.audienceType === 'all' ? 'All students' : form.audienceValue || form.audienceType;
    const data = { ...form, audienceLabel, author: trainerData?.displayName || 'Trainer' };
    let id = editingId;
    if (id) api.updateAnnouncement(id, data);
    else id = api.createAnnouncement(data).id;
    if (mode === 'publish') api.publishAnnouncement(id);
    if (mode === 'schedule' && form.publishAt) api.scheduleAnnouncement(id, new Date(form.publishAt).toISOString());
    setSelectedId(id); setEditorOpen(false);
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
          {list.map((item) => (
            <button key={item.id} className={`ta-row ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)}>
              <i>{item.type === 'Competition' ? '🏆' : item.type === 'Policy' ? '📄' : '📢'}</i>
              <span><small className={`ta-type ${item.type.toLowerCase().replace(' ', '-')}`}>{item.type}</small><strong>{item.title}</strong><em><FiUsers /> {item.audienceLabel}</em></span>
              <b><time>{new Date(item.publishAt || item.publishedAt || item.createdAt).toLocaleDateString()}</time><small className={`ta-status ${item.status}`}>{labels[item.status]}</small></b>
            </button>
          ))}
          {!list.length && <div className="ta-empty">No announcements match the selected filters.</div>}
        </section>

        <aside className="ta-preview">
          {selected ? <>
            <small className={`ta-type ${selected.type.toLowerCase().replace(' ', '-')}`}>{selected.type}</small>
            <h2>{selected.title}</h2>
            <div className="ta-preview-meta"><span className={`ta-status ${selected.status}`}>{labels[selected.status]}</span><span><FiUsers /> {selected.audienceLabel}</span></div>
            <p className="ta-date"><FiCalendar /> {selected.status === 'scheduled' ? 'Scheduled' : 'Published'} on {new Date(selected.publishAt || selected.publishedAt || selected.createdAt).toLocaleString()}</p>
            <div className="ta-copy">{selected.content.split('\n').map((line, index) => <p key={index}>{line || <br />}</p>)}</div>
            {selected.attachment && <div className="ta-file"><FiFileText /><span><strong>{selected.attachment.name}</strong><small>{selected.attachment.size}</small></span></div>}
            {selected.link && <a className="ta-link" href={selected.link}>Open related page</a>}
            {selected.status === 'published' && <div className="ta-delivery"><FiBell /><span><strong>Student notification sent</strong><small>{stats.recipients} recipients · {stats.views} viewed</small></span></div>}
            <div className="ta-actions"><button onClick={() => openEdit(selected)}><FiEdit2 /> Edit announcement</button><button onClick={() => setSelectedId(api.duplicateAnnouncement(selected.id)?.id)}><FiCopy /> Duplicate</button></div>
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
            <label>Audience<select value={form.audienceType} onChange={(event) => setForm({ ...form, audienceType: event.target.value })}><option value="all">All students</option><option value="faculty">Faculty</option><option value="major">Major</option><option value="course">Course</option><option value="students">Selected students</option></select></label>
            {form.audienceType !== 'all' && <label className="full">Audience value *<input value={form.audienceValue} onChange={(event) => setForm({ ...form, audienceValue: event.target.value })} required /></label>}
            <label className="full">Content *<textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required /></label>
            <label>Related link<input value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} placeholder="/student-dashboard/competitions" /></label>
            <label>Schedule time<input type="datetime-local" value={form.publishAt} onChange={(event) => setForm({ ...form, publishAt: event.target.value })} /></label>
            <label className="full">Attachment<input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) setForm({ ...form, attachment: { name: file.name, size: `${Math.ceil(file.size / 1024)} KB` } }); }} /></label>
          </div>
          <footer><button type="button" className="ghost" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" className="ghost">Save draft</button><button type="button" className="schedule" disabled={!form.publishAt} onClick={() => save('schedule')}>Schedule</button><button type="button" className="publish" onClick={() => save('publish')}>Publish now</button></footer>
        </form>
      </div>}
    </div>
  );
}
