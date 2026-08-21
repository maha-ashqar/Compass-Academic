import { useState } from "react";
import { ArrowRight, Check, Menu, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CompassWordmark from "./CompassWordmark";
import { coursesData } from "./coursesData";
import heroImg from "./assets/hero.jpg";
import mentorAhmad from "./assets/mentor-ahmad-khalil.jpg";
import mentorSara from "./assets/mentor-sara-youssef.jpg";
import studentMaha from "./assets/student-maha.jpg";
import studentAnas from "./assets/student-anas.jpg";
import studentNoor from "./assets/student-noor.jpg";
import "./HomePage.css";
const NAV_LINKS = [
  ["home", "Home"],
  ["programs", "Programs"],
  ["paths", "Learning paths"],
  ["projects", "Projects"],
  ["mentors", "Mentors"],
  ["about", "About"],
];

const HERO_BENEFITS = ["Free student access", "Practical learning paths", "Mentor feedback"];

/* ============================================
   PRINCIPLES STRIP
   [number, title, subtitle]
   ============================================ */
const PRINCIPLES = [
  ["01", "Learn", "Structured courses"],
  ["02", "Build", "Portfolio projects"],
  ["03", "Connect", "Mentor guidance"],
  ["04", "Compete", "Skill challenges"],
];

/* ============================================
   JOURNEY SECTION — 4 learning steps
   [number, title, description]
   ============================================ */
const JOURNEY_STEPS = [
  ["01", "Choose a path", "Start with a clear goal and structured plan."],
  ["02", "Learn by doing", "Practice through lessons, tasks and feedback."],
  ["03", "Build a project", "Create a portfolio-ready practical outcome."],
  ["04", "Earn recognition", "Showcase progress through certificates and challenges."],
];

/* ============================================
   PROJECTS BANNER — mini gallery preview
   [projectName, techStack, badgeLabel]
   ============================================ */
const FEATURED_PROJECTS = [
  ["Campus Services Portal", "React · Node.js · PostgreSQL", "Featured"],
  ["Student Wellbeing App", "Research · UI/UX · Prototype", "New"],
  ["Academic Support Assistant", "Python · NLP · API", "Top rated"],
];

/* ============================================
   MENTORS SECTION
   [image, name, role, specialty, bio]
   ============================================ */
const MENTORS = [
  [
    mentorAhmad,
    "Eng. Ahmad Khalil",
    "Senior Software Architect",
    "Software Engineering",
    "8+ years in product architecture and technical mentorship.",
  ],
  [
    mentorSara,
    "Eng. Sara Youssef",
    "Mobile Engineering Lead",
    "Flutter & Product Delivery",
    "Practical guidance for building reliable, user-focused products.",
  ],
];

/* ============================================
   STUDENT TESTIMONIALS
   ============================================ */
const TESTIMONIALS = [
  {
    quote:
      "The clear path helped me stop jumping between random tutorials. I finally knew what to learn next and why.",
    name: "Maha K.",
    role: "Computer Science student",
    image: studentMaha,
  },
  {
    quote: "Instructor feedback made the biggest difference. I could see what was weak and how to improve it.",
    name: "Anas A.",
    role: "Software Engineering student",
    image: studentAnas,
  },
  {
    quote:
      "Competitions made learning practical. Working with a team pushed me to communicate and finish what I started.",
    name: "Noor S.",
    role: "Information Technology student",
    image: studentNoor,
  },
];

/* ============================================
   STATS STRIP (bottom of testimonials section)
   [value, label]
   ============================================ */
const PLATFORM_STATS = [
  ["80+", "Learning opportunities"],
  ["23+", "Expert instructors"],
  ["4", "Ways to build experience"],
  ["1", "Focused student journey"],
];

function Homepage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /** Closes the mobile menu (if open) and smooth-scrolls to a section by id. */
  const goTo = (sectionId) => {
    setMobileMenuOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="home-page">
      {/* ============================================
          HEADER
          ============================================ */}
      <header className="home-header">
        <div className="home-container header-inner">
          <button
            type="button"
            className="brand-button"
            onClick={() => goTo("home")}
            aria-label="Compass Academy home"
          >
            <CompassWordmark size={20} navy="#082d47" academyColor="#24b8ec" />
          </button>

          <nav className={`main-nav ${mobileMenuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            {NAV_LINKS.map(([key, label]) => (
              <button type="button" key={key} onClick={() => goTo(key)}>
                {label}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button className="button button-outline compact" onClick={() => navigate("/trainer-login")}>
              Trainer portal
            </button>
            <button className="button button-primary compact" onClick={() => navigate("/login")}>
              Student login
            </button>
            <button
              className="menu-button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ============================================
            HERO SECTION
            ============================================ */}
        <section className="hero-section" id="home">
          <div className="home-container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow pill">● Built for Al-Azhar students</span>
              <h1>
                Find your direction.
                <br />
                Build what comes next.
              </h1>
              <p className="lead">
                A focused learning platform that connects university study with practical courses,
                projects, competitions and mentorship.
              </p>

              <div className="hero-actions">
                <button className="button button-primary" onClick={() => navigate("/login")}>
                  Start learning free
                </button>
                <button className="button button-outline" onClick={() => goTo("programs")}>
                  Explore programs
                </button>
              </div>

              <div className="benefits">
                {HERO_BENEFITS.map((item) => (
                  <span key={item}>
                    <i>
                      <Check size={11} />
                    </i>
                    {item}
                  </span>
                ))}
              </div>

              <div className="independent-note">
                <strong>Independent student platform</strong>
                <span>Inspired by academic purpose — built around real student needs.</span>
              </div>
            </div>

            <div className="hero-card">
              <img src={heroImg} alt="Students collaborating around laptops" />
              <div className="hero-card-caption">
                <div>
                  <h2>Learn together. Build with purpose.</h2>
                  <p>Courses, projects and mentorship in one student journey.</p>
                </div>
                <button onClick={() => goTo("paths")} aria-label="View learning journey">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            PRINCIPLES STRIP
            ============================================ */}
        <section className="principles-strip" aria-label="Platform principles">
          <div className="home-container principles-grid">
            {PRINCIPLES.map(([number, title, text]) => (
              <div className="principle" key={number}>
                <strong>
                  {number} {title}
                </strong>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================
            PROGRAMS SECTION (course cards)
            ============================================ */}
        <section className="section programs-section" id="programs">
          <div className="home-container">
            <div className="section-heading split-heading">
              <div>
                <span className="eyebrow">Explore programs</span>
                <h2>Build skills that move with you</h2>
                <p>Choose a focused path, learn at your pace, and apply every concept through practical work.</p>
              </div>
              <button className="text-link" onClick={() => navigate("/login")}>
                View all programs <ArrowRight size={14} />
              </button>
            </div>

            <div className="course-grid">
              {coursesData.slice(0, 6).map((course) => (
                <article className="course-card" key={course.id}>
                  <img src={course.coverImage} alt="" />
                  <div className="course-body">
                    <span className="course-category">{course.category}</span>
                    <h3>{course.title}</h3>
                    <p className="course-instructor">{course.instructor}</p>
                    <div className="course-meta">
                      <span>{course.level}</span>
                      <span>{course.duration}</span>
                      <span>{course.lessons} lessons</span>
                    </div>
                    <div className="course-footer">
                      <span className="rating">
                        <Star size={13} fill="currentColor" /> {course.rating}
                      </span>
                      <button onClick={() => navigate("/login")}>
                        View course <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            JOURNEY SECTION (learning path steps)
            ============================================ */}
        <section className="section journey-section" id="paths">
          <div className="home-container">
            <div className="section-heading centered">
              <span className="eyebrow">A complete student journey</span>
              <h2>From learning a skill to proving it</h2>
              <p>Every path moves students from theory to visible, practical progress.</p>
            </div>

            <div className="journey-grid">
              {JOURNEY_STEPS.map(([number, title, text]) => (
                <article className="journey-step" key={number}>
                  <div className="journey-number">{number}</div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            PROJECTS BANNER SECTION
            ============================================ */}
        <section className="section projects-section" id="projects">
          <div className="home-container">
            <div className="projects-banner">
              <div className="projects-copy">
                <span className="eyebrow light">Student projects</span>
                <h2>
                  Learning becomes valuable
                  <br />
                  when it becomes visible.
                </h2>
                <p>Publish practical work, receive instructor feedback, and build a portfolio that reflects real abilities.</p>
                <button className="button white-button" onClick={() => navigate("/login")}>
                  Explore student projects
                </button>
              </div>

              <div className="gallery-window">
                <div className="window-bar">
                  <span></span>
                  <span></span>
                  <span></span>
                  <b>Project Gallery</b>
                </div>
                {FEATURED_PROJECTS.map(([name, stack, badge], index) => (
                  <div className="project-row" key={name}>
                    <i className={`project-dot dot-${index + 1}`}></i>
                    <div>
                      <strong>{name}</strong>
                      <span>{stack}</span>
                    </div>
                    <b>{badge}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            MENTORS SECTION
            ============================================ */}
        <section className="section mentors-section" id="mentors">
          <div className="home-container">
            <div className="section-heading">
              <span className="eyebrow">Guidance that feels human</span>
              <h2>Learn with people who understand the work</h2>
              <p>Mentors help students move through blockers, improve projects, and make better academic decisions.</p>
            </div>

            <div className="mentor-grid">
              {MENTORS.map(([image, name, role, specialty, bio]) => (
                <article className="mentor-card" key={name}>
                  <img src={image} alt="" />
                  <div>
                    <h3>{name}</h3>
                    <p>{role}</p>
                    <span>{specialty}</span>
                    <small>{bio}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
            STUDENT VOICES / TESTIMONIALS + STATS
            ============================================ */}
        <section className="section voices-section" id="about">
          <div className="home-container">
            <div className="section-heading centered">
              <span className="eyebrow">Student voices</span>
              <h2>Real support changes how students learn</h2>
            </div>

            <div className="testimonial-grid">
              {TESTIMONIALS.map((item) => (
                <article className="testimonial-card" key={item.name}>
                  <span className="quote-mark">"</span>
                  <p>{item.quote}</p>
                  <div>
                    <img src={item.image} alt="" />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.role}</small>
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="stats-grid">
              {PLATFORM_STATS.map(([value, label]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="home-page-footer">
        <div className="home-container footer-grid">
          <div>
            <CompassWordmark size={19} navy="#ffffff" academyColor="#24b8ec" />
            <p>Independent learning platform for Al-Azhar University students.</p>
          </div>
          <div>
            <strong>Platform</strong>
            <p>Programs · Projects · Competitions · Mentors</p>
          </div>
          <div>
            <strong>Access</strong>
            <p>Student login · Trainer portal</p>
          </div>
        </div>
        <div className="home-container copyright">© 2026 Compass Academy · Independent student platform</div>
      </footer>
    </div>
  );
}

export default Homepage;