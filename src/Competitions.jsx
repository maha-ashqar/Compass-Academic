import { useState, useMemo } from 'react';
import { competitionsData } from './competitionsData';
import { useCompetitions } from './CompetitionsContext';
import './Competitions.css';

const TODAY = new Date('2026-07-18');

const getStatus = (comp) => {
  const regDeadline = new Date(comp.registrationDeadline);
  const start = new Date(comp.startDate);
  const end = new Date(comp.endDate);

  if (TODAY > end) return 'ended';
  if (TODAY >= start && TODAY <= end) return 'ongoing';
  if (TODAY <= regDeadline) return 'upcoming';
  return 'closed'; 
};

const STATUS_LABELS = {
  ongoing: { label: 'Ongoing', cls: 'ongoing' },
  upcoming: { label: 'Open for Registration', cls: 'upcoming' },
  closed: { label: 'Registration Closed', cls: 'closed' },
  ended: { label: 'Ended', cls: 'ended' },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Open for Registration' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'ended', label: 'Ended' },
];

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const daysUntil = (isoDate) => {
  const diff = new Date(isoDate).getTime() - TODAY.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const Competitions = () => {
  const { isRegistered, register, unregister } = useCompetitions();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedComp, setSelectedComp] = useState(null);

  const withStatus = useMemo(
    () => competitionsData.map((c) => ({ ...c, status: getStatus(c) })),
    []
  );

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return withStatus;
    if (activeFilter === 'ended') return withStatus.filter((c) => c.status === 'ended');
    if (activeFilter === 'ongoing') return withStatus.filter((c) => c.status === 'ongoing');
    if (activeFilter === 'upcoming') return withStatus.filter((c) => c.status === 'upcoming');
    return withStatus;
  }, [withStatus, activeFilter]);

  const counts = useMemo(() => ({
    all: withStatus.length,
    upcoming: withStatus.filter((c) => c.status === 'upcoming').length,
    ongoing: withStatus.filter((c) => c.status === 'ongoing').length,
    ended: withStatus.filter((c) => c.status === 'ended').length,
  }), [withStatus]);

  const handleRegisterToggle = (comp) => {
    if (isRegistered(comp.id)) {
      if (window.confirm('هل تريد إلغاء التسجيل من هذه المسابقة؟')) {
        unregister(comp.id);
      }
    } else {
      register(comp.id);
    }
  };

  if (selectedComp) {
    const comp = { ...selectedComp, status: getStatus(selectedComp) };
    const statusMeta = STATUS_LABELS[comp.status];
    const registered = isRegistered(comp.id);
    const canRegister = comp.status === 'upcoming';

    return (
      <div className="comp-container">
        <button className="comp-back-button" onClick={() => setSelectedComp(null)}>
          ‹ Back to Competitions
        </button>

        <div className="comp-detail-card">
          <div className="comp-detail-header">
            <div className="comp-detail-top-row">
              <span className={`comp-status-badge ${statusMeta.cls}`}>{statusMeta.label}</span>
              <span className="comp-detail-category">{comp.category}</span>
            </div>

            <h1 className="comp-detail-title">{comp.title}</h1>
            <p className="comp-detail-organizer">Organized by {comp.organizer}</p>

            <div className="comp-detail-meta">
              <div className="comp-meta-item">
                <span className="comp-meta-label">Prize</span>
                <span className="comp-meta-value gold">{comp.prize}</span>
              </div>
              <div className="comp-meta-item">
                <span className="comp-meta-label">Team Size</span>
                <span className="comp-meta-value">{comp.teamSize}</span>
              </div>
              <div className="comp-meta-item">
                <span className="comp-meta-label">Level</span>
                <span className="comp-meta-value">{comp.level}</span>
              </div>
              <div className="comp-meta-item">
                <span className="comp-meta-label">Participants</span>
                <span className="comp-meta-value">{comp.participants}</span>
              </div>
            </div>
          </div>

          <div className="comp-detail-body">
            <section className="comp-section">
              <h3>About this competition</h3>
              <p>{comp.description}</p>
            </section>

            <section className="comp-section">
              <h3>Requirements</h3>
              <ul className="comp-plain-list">
                {comp.requirements.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>

            <section className="comp-section">
              <h3>Rules</h3>
              <ul className="comp-plain-list">
                {comp.rules.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>

            <section className="comp-section">
              <h3>Timeline</h3>
              <div className="comp-timeline">
                {comp.timeline.map((t, i) => {
                  const passed = TODAY >= new Date(t.date);
                  return (
                    <div key={i} className={`comp-timeline-item ${passed ? 'passed' : ''}`}>
                      <span className="comp-timeline-dot" />
                      <div>
                        <span className="comp-timeline-label">{t.label}</span>
                        <span className="comp-timeline-date">{formatDate(t.date)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="comp-register-box">
            {registered ? (
              <>
                <p className="comp-registered-note">✓ You are registered for this competition</p>
                <button className="comp-register-btn outline" onClick={() => handleRegisterToggle(comp)}>
                  Cancel Registration
                </button>
              </>
            ) : canRegister ? (
              <>
                <p className="comp-deadline-note">
                  Registration closes in {daysUntil(comp.registrationDeadline)} day
                  {daysUntil(comp.registrationDeadline) !== 1 ? 's' : ''}
                </p>
                <button className="comp-register-btn" onClick={() => handleRegisterToggle(comp)}>
                  🏆 Register Now
                </button>
              </>
            ) : (
              <p className="comp-closed-note">
                {comp.status === 'ongoing' && 'This competition is currently in progress.'}
                {comp.status === 'closed' && 'Registration for this competition has closed.'}
                {comp.status === 'ended' && 'This competition has ended.'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="comp-container">
      <div className="comp-page-header">
        <h1>Competitions</h1>
        <p>Compete, showcase your skills, and win recognition across national and academic challenges.</p>
      </div>

      <div className="comp-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`comp-filter-tab ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
            <span className="comp-filter-count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="comp-empty">
          <div className="comp-empty-icon">🏆</div>
          <h3>No competitions here</h3>
          <p>Try a different filter or check back later.</p>
        </div>
      ) : (
        <div className="comp-grid">
          {filtered.map((comp) => {
            const statusMeta = STATUS_LABELS[comp.status];
            const registered = isRegistered(comp.id);

            return (
              <div key={comp.id} className="comp-card" onClick={() => setSelectedComp(comp)}>
                <div className="comp-card-top">
                  <span className={`comp-status-badge ${statusMeta.cls}`}>{statusMeta.label}</span>
                  {registered && <span className="comp-registered-tag">✓ Registered</span>}
                </div>

                <p className="comp-card-category">{comp.category}</p>
                <h3 className="comp-card-title">{comp.title}</h3>
                <p className="comp-card-organizer">{comp.organizer}</p>

                <div className="comp-card-footer">
                  <div className="comp-card-prize">
                    <span className="comp-card-prize-label">Prize</span>
                    <span className="comp-card-prize-value">{comp.prize}</span>
                  </div>
                  <div className="comp-card-participants">
                    👥 {comp.participants}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Competitions;