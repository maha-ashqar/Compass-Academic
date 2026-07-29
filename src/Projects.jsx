import { useState, useMemo } from 'react';
import { projectsData, PROJECT_CATEGORIES } from './projectsData';
import { useProjects } from './ProjectsContext';
import './Projects.css';

const getInitials = (name) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const Projects = () => {
  const { isLiked, toggleLike } = useProjects();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [sortBy, setSortBy] = useState('featured'); // featured | likes

  const filtered = useMemo(() => {
    let list = projectsData;

    if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.team.some((m) => m.toLowerCase().includes(q))
      );
    }

    const sorted = [...list];
    if (sortBy === 'featured') {
      sorted.sort((a, b) => (b.featured === true) - (a.featured === true) || b.likes - a.likes);
    } else {
      sorted.sort((a, b) => b.likes - a.likes);
    }

    return sorted;
  }, [activeCategory, searchQuery, sortBy]);

  const getLikeCount = (project) => project.likes + (isLiked(project.id) ? 1 : 0);

  // ============ عرض تفاصيل مشروع ============
  if (selectedProject) {
    const p = selectedProject;
    const liked = isLiked(p.id);

    return (
      <div className="proj-container">
        <button className="proj-back-button" onClick={() => setSelectedProject(null)}>
          ‹ Back to Gallery
        </button>

        <div className="proj-detail-card">
          <div className="proj-detail-visual">
            <span className="proj-detail-category-tag">{p.category}</span>
            {p.featured && <span className="proj-featured-tag">⭐ Featured</span>}
          </div>

          <div className="proj-detail-body">
            <h1 className="proj-detail-title">{p.title}</h1>
            <p className="proj-detail-course">From: {p.course}</p>

            <p className="proj-detail-desc">{p.description}</p>

            <div className="proj-detail-section">
              <h4>Tech Stack</h4>
              <div className="proj-tech-tags">
                {p.techStack.map((t, i) => (
                  <span key={i} className="proj-tech-tag">{t}</span>
                ))}
              </div>
            </div>

            <div className="proj-detail-section">
              <h4>Team</h4>
              <div className="proj-team-list">
                {p.team.map((member, i) => (
                  <div key={i} className="proj-team-member">
                    <span className="proj-team-avatar">{getInitials(member)}</span>
                    <span>{member}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="proj-detail-actions">
              <button
                className={`proj-like-btn ${liked ? 'active' : ''}`}
                onClick={() => toggleLike(p.id)}
              >
                {liked ? '❤️' : '🤍'} {getLikeCount(p)}
              </button>

              {p.links?.demo && (
                <button className="proj-link-btn" onClick={() => window.open(p.links.demo, '_blank')}>
                  🔗 View Demo
                </button>
              )}
              {p.links?.github && (
                <button className="proj-link-btn outline" onClick={() => window.open(p.links.github, '_blank')}>
                  💻 View Code
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ الشبكة الرئيسية ============
  return (
    <div className="proj-container">
      <div className="proj-page-header">
        <h1>Projects Gallery</h1>
        <p>Explore real projects built by Compass Academy students across every track.</p>
      </div>

      <div className="proj-controls">
        <div className="proj-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search projects, teams, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="proj-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="featured">Featured First</option>
          <option value="likes">Most Liked</option>
        </select>
      </div>

      <div className="proj-category-tabs">
        <button
          className={`proj-category-tab ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All Categories
        </button>
        {PROJECT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`proj-category-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="proj-empty">
          <div className="proj-empty-icon">🖼️</div>
          <h3>No projects found</h3>
          <p>Try a different search term or category.</p>
        </div>
      ) : (
        <div className="proj-grid">
          {filtered.map((p) => {
            const liked = isLiked(p.id);
            return (
              <div key={p.id} className="proj-card" onClick={() => setSelectedProject(p)}>
                <div className="proj-card-visual">
                  <span className="proj-card-category-tag">{p.category}</span>
                  {p.featured && <span className="proj-card-featured">⭐</span>}
                </div>

                <div className="proj-card-body">
                  <h3 className="proj-card-title">{p.title}</h3>
                  <p className="proj-card-desc">{p.description}</p>

                  <div className="proj-card-tech">
                    {p.techStack.slice(0, 3).map((t, i) => (
                      <span key={i} className="proj-tech-tag small">{t}</span>
                    ))}
                    {p.techStack.length > 3 && (
                      <span className="proj-tech-tag small more">+{p.techStack.length - 3}</span>
                    )}
                  </div>

                  <div className="proj-card-footer">
                    <div className="proj-card-team">
                      {p.team.slice(0, 3).map((member, i) => (
                        <span key={i} className="proj-team-avatar small" style={{ zIndex: 10 - i }}>
                          {getInitials(member)}
                        </span>
                      ))}
                    </div>

                    <button
                      className={`proj-like-btn small ${liked ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleLike(p.id); }}
                    >
                      {liked ? '❤️' : '🤍'} {getLikeCount(p)}
                    </button>
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

export default Projects;