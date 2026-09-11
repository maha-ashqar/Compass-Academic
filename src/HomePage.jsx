import { useEffect, useState } from "react";
import { ArrowRight, Check, Menu, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CompassWordmark from "./CompassWordmark";
import { getHomeData } from "./api/home";
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

const HERO_BENEFITS = [
  "Free student access",
  "Practical learning paths",
  "Mentor feedback",
];

const PRINCIPLES = [
  ["01", "Learn", "Structured courses"],
  ["02", "Build", "Portfolio projects"],
  ["03", "Connect", "Mentor guidance"],
  ["04", "Compete", "Skill challenges"],
];

const JOURNEY_STEPS = [
  [
    "01",
    "Choose a path",
    "Start with a clear goal and structured plan.",
  ],
  [
    "02",
    "Learn by doing",
    "Practice through lessons, tasks and feedback.",
  ],
  [
    "03",
    "Build a project",
    "Create a portfolio-ready practical outcome.",
  ],
  [
    "04",
    "Earn recognition",
    "Showcase progress through certificates and challenges.",
  ],
];

const MENTOR_FALLBACK_IMAGES = [
  mentorAhmad,
  mentorSara,
];

const TESTIMONIALS = [
  {
    quote:
      "The clear path helped me stop jumping between random tutorials. I finally knew what to learn next and why.",
    name: "Maha K.",
    role: "Computer Science student",
    image: studentMaha,
  },
  {
    quote:
      "Instructor feedback made the biggest difference. I could see what was weak and how to improve it.",
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

function Homepage() {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [homeData, setHomeData] = useState({
    courses: [],
    projects: [],
    trainers: [],
    stats: {
      published_courses: 0,
      active_trainers: 0,
      published_projects: 0,
      students: 0,
    },
  });

  useEffect(() => {
    let active = true;

    const loadHomeData = async () => {
      try {
        const data = await getHomeData();

        if (active) {
          setHomeData({
            courses: data.courses || [],
            projects: data.projects || [],
            trainers: data.trainers || [],
            stats: data.stats || {},
          });
        }
      } catch (error) {
        console.error(
          "Unable to load public home data:",
          error
        );
      }
    };

    loadHomeData();

    return () => {
      active = false;
    };
  }, []);

  const courses = homeData.courses || [];
  const featuredProjects = homeData.projects || [];
  const mentors = homeData.trainers || [];
  const stats = homeData.stats || {};

  const platformStats = [
    [
      String(stats.published_courses ?? 0),
      "Published courses",
    ],
    [
      String(stats.active_trainers ?? 0),
      "Expert instructors",
    ],
    [
      String(stats.published_projects ?? 0),
      "Student projects",
    ],
    [
      String(stats.students ?? 0),
      "Registered students",
    ],
  ];

  const goTo = (sectionId) => {
    setMobileMenuOpen(false);

    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const FOOTER_PLATFORM_LINKS = [
    ["Programs", () => goTo("programs")],
    ["Projects", () => goTo("projects")],
    ["Competitions", () => navigate("/login")],
    ["Mentors", () => goTo("mentors")],
  ];

  const FOOTER_ACCESS_LINKS = [
    ["Student login", () => navigate("/login")],
    [
      "Trainer portal",
      () => navigate("/trainer-login"),
    ],
  ];

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-container header-inner">
          <button
            type="button"
            className="brand-button"
            onClick={() => goTo("home")}
            aria-label="Compass Academy home"
          >
            <CompassWordmark
              size={20}
              navy="#082d47"
              academyColor="#24b8ec"
            />
          </button>

          <nav
            className={`main-nav ${
              mobileMenuOpen ? "is-open" : ""
            }`}
            aria-label="Main navigation"
          >
            {NAV_LINKS.map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() => goTo(key)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="button button-outline compact"
              onClick={() =>
                navigate("/trainer-login")
              }
            >
              Trainer portal
            </button>

            <button
              className="button button-primary compact"
              onClick={() => navigate("/login")}
            >
              Student login
            </button>

            <button
              className="menu-button"
              onClick={() =>
                setMobileMenuOpen(
                  (open) => !open
                )
              }
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section
          className="hero-section"
          id="home"
        >
          <div className="home-container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow pill">
                ● Built for Al-Azhar students
              </span>

              <h1>
                Find your direction.
                <br />
                Build what comes next.
              </h1>

              <p className="lead">
                A focused learning platform that
                connects university study with
                practical courses, projects,
                competitions and mentorship.
              </p>

              <div className="hero-actions">
                <button
                  className="button button-primary"
                  onClick={() =>
                    navigate("/login")
                  }
                >
                  Start learning free
                </button>

                <button
                  className="button button-outline"
                  onClick={() =>
                    goTo("programs")
                  }
                >
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
                <strong>
                  Independent student platform
                </strong>

                <span>
                  Inspired by academic purpose —
                  built around real student needs.
                </span>
              </div>
            </div>

            <div className="hero-card">
              <img
                src={heroImg}
                alt="Students collaborating around laptops"
              />

              <div className="hero-card-caption">
                <div>
                  <h2>
                    Learn together. Build with
                    purpose.
                  </h2>

                  <p>
                    Courses, projects and mentorship
                    in one student journey.
                  </p>
                </div>

                <button
                  onClick={() => goTo("paths")}
                  aria-label="View learning journey"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          className="principles-strip"
          aria-label="Platform principles"
        >
          <div className="home-container principles-grid">
            {PRINCIPLES.map(
              ([number, title, text]) => (
                <div
                  className="principle"
                  key={number}
                >
                  <strong>
                    {number} {title}
                  </strong>

                  <span>{text}</span>
                </div>
              )
            )}
          </div>
        </section>

        <section
          className="section programs-section"
          id="programs"
        >
          <div className="home-container">
            <div className="section-heading split-heading">
              <div>
                <span className="eyebrow">
                  Explore programs
                </span>

                <h2>
                  Build skills that move with you
                </h2>

                <p>
                  Choose a focused path, learn at
                  your pace, and apply every concept
                  through practical work.
                </p>
              </div>

              <button
                className="text-link"
                onClick={() =>
                  navigate("/login")
                }
              >
                View all programs{" "}
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="course-grid">
              {courses.map((course) => (
                <article
                  className="course-card"
                  key={course.id}
                >
                  <img
                    src={
                      course.coverImage ||
                      heroImg
                    }
                    alt=""
                  />

                  <div className="course-body">
                    <span className="course-category">
                      {course.category}
                    </span>

                    <h3>{course.title}</h3>

                    <p className="course-instructor">
                      {course.instructor}
                    </p>

                    <div className="course-meta">
                      <span>
                        {course.level}
                      </span>

                      <span>
                        {course.duration}
                      </span>

                      <span>
                        {course.lessons} lessons
                      </span>
                    </div>

                    <div className="course-footer">
                      <span className="rating">
                        <Star
                          size={13}
                          fill="currentColor"
                        />{" "}
                        {course.rating}
                      </span>

                      <button
                        onClick={() =>
                          navigate("/login")
                        }
                      >
                        View course{" "}
                        <ArrowRight
                          size={13}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="section journey-section"
          id="paths"
        >
          <div className="home-container">
            <div className="section-heading centered">
              <span className="eyebrow">
                A complete student journey
              </span>

              <h2>
                From learning a skill to proving it
              </h2>

              <p>
                Every path moves students from
                theory to visible, practical
                progress.
              </p>
            </div>

            <div className="journey-grid">
              {JOURNEY_STEPS.map(
                ([number, title, text]) => (
                  <article
                    className="journey-step"
                    key={number}
                  >
                    <div className="journey-number">
                      {number}
                    </div>

                    <h3>{title}</h3>

                    <p>{text}</p>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        <section
          className="section projects-section"
          id="projects"
        >
          <div className="home-container">
            <div className="projects-banner">
              <div className="projects-copy">
                <span className="eyebrow light">
                  Student projects
                </span>

                <h2>
                  Learning becomes valuable
                  <br />
                  when it becomes visible.
                </h2>

                <p>
                  Publish practical work, receive
                  instructor feedback, and build a
                  portfolio that reflects real
                  abilities.
                </p>

                <button
                  className="button white-button"
                  onClick={() =>
                    navigate("/login")
                  }
                >
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

                {featuredProjects.map(
                  (project, index) => (
                    <div
                      className="project-row"
                      key={project.id}
                    >
                      <i
                        className={`project-dot dot-${
                          index + 1
                        }`}
                      ></i>

                      <div>
                        <strong>
                          {project.title}
                        </strong>

                        <span>
                          {project.stack}
                        </span>
                      </div>

                      <b>{project.badge}</b>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          className="section mentors-section"
          id="mentors"
        >
          <div className="home-container">
            <div className="section-heading">
              <span className="eyebrow">
                Guidance that feels human
              </span>

              <h2>
                Learn with people who understand
                the work
              </h2>

              <p>
                Mentors help students move through
                blockers, improve projects, and make
                better academic decisions.
              </p>
            </div>

            <div className="mentor-grid">
              {mentors.map(
                (mentor, index) => (
                  <article
                    className="mentor-card"
                    key={mentor.id}
                  >
                    <img
                      src={
                        mentor.image ||
                        MENTOR_FALLBACK_IMAGES[
                          index %
                            MENTOR_FALLBACK_IMAGES.length
                        ]
                      }
                      alt=""
                    />

                    <div>
                      <h3>
                        {mentor.name}
                      </h3>

                      <p>
                        {mentor.role}
                      </p>

                      <span>
                        {mentor.specialty}
                      </span>

                      <small>
                        {mentor.bio}
                      </small>
                    </div>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        <section
          className="section voices-section"
          id="about"
        >
          <div className="home-container">
            <div className="section-heading centered">
              <span className="eyebrow">
                Student voices
              </span>

              <h2>
                Real support changes how students
                learn
              </h2>
            </div>

            <div className="testimonial-grid">
              {TESTIMONIALS.map((item) => (
                <article
                  className="testimonial-card"
                  key={item.name}
                >
                  <span className="quote-mark">
                    "
                  </span>

                  <p>{item.quote}</p>

                  <div>
                    <img
                      src={item.image}
                      alt=""
                    />

                    <span>
                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        {item.role}
                      </small>
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="stats-grid">
              {platformStats.map(
                ([value, label]) => (
                  <div key={label}>
                    <strong>
                      {value}
                    </strong>

                    <span>{label}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="home-page-footer">
        <div className="home-container footer-grid">
          <div>
            <button
              type="button"
              className="footer-brand"
              onClick={() => goTo("home")}
              aria-label="Back to top"
            >
              <CompassWordmark
                size={19}
                navy="#ffffff"
                academyColor="#24b8ec"
              />
            </button>

            <p>
              Independent learning platform for
              Al-Azhar University students.
            </p>
          </div>

          <div>
            <strong>Platform</strong>

            <nav
              className="footer-links"
              aria-label="Platform sections"
            >
              {FOOTER_PLATFORM_LINKS.map(
                ([label, onClick], index) => (
                  <span key={label}>
                    {index > 0 && (
                      <span
                        className="footer-dot"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={onClick}
                    >
                      {label}
                    </button>
                  </span>
                )
              )}
            </nav>
          </div>

          <div>
            <strong>Access</strong>

            <nav
              className="footer-links"
              aria-label="Account access"
            >
              {FOOTER_ACCESS_LINKS.map(
                ([label, onClick], index) => (
                  <span key={label}>
                    {index > 0 && (
                      <span
                        className="footer-dot"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={onClick}
                    >
                      {label}
                    </button>
                  </span>
                )
              )}
            </nav>
          </div>
        </div>

        <div className="home-container copyright">
          © {new Date().getFullYear()} Compass
          Academy · Independent student platform
        </div>
      </footer>
    </div>
  );
}

export default Homepage;