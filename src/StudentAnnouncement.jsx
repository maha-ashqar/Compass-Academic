import { useEffect } from 'react';
import { FiArrowLeft, FiCalendar, FiDownload, FiExternalLink, FiFileText, FiUsers } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { useAnnouncements } from './AnnouncementsContext';
import './StudentAnnouncement.css';

export default function StudentAnnouncement({ studentData }) {
  const { announcementId } = useParams();
  const navigate = useNavigate();
  const api = useAnnouncements();
  const item = api.getAnnouncementById(announcementId);

  useEffect(() => {
    if (item?.status === 'published') api.markAnnouncementRead(item.id, studentData?.email || studentData?.id);
  }, [api, item, studentData]);

  if (!item || item.status !== 'published') return <div className="sa-not-found"><h2>Announcement unavailable</h2><button onClick={() => navigate('/student-dashboard')}>Back to dashboard</button></div>;

  return <article className="sa-page">
    <button className="sa-back" onClick={() => navigate('/student-dashboard', { state: { activeTab: 'Notifications' } })}><FiArrowLeft /> Back to notifications</button>
    <header><small>{item.type}</small><h1>{item.title}</h1><div><span><FiCalendar /> {new Date(item.publishedAt).toLocaleString()}</span><span><FiUsers /> {item.audienceLabel}</span></div></header>
    <section className="sa-content">{item.content.split('\n').map((line, index) => <p key={index}>{line || <br />}</p>)}</section>
    {item.attachment && <button className="sa-resource"><FiFileText /><span><strong>{item.attachment.name}</strong><small>{item.attachment.size}</small></span><FiDownload /></button>}
    {item.link && <button className="sa-related" onClick={() => navigate(item.link)}><FiExternalLink /> Open related page</button>}
    <footer>Published by {item.author || 'Compass Academy'}</footer>
  </article>;
}
