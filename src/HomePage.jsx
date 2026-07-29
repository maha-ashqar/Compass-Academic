import { useState, useRef } from "react";
import "./HomePage.css";
import heroImg from "./assets/heroo.png";
import CompassWordmark from "./CompassWordmark";
import { useNavigate } from "react-router-dom";
import { coursesData } from "./coursesData";

const getInitials = (category) => {
  return category
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

const testimonials = [
  {
    name: "أنس أ.",
    initials: "أ",
    quote:
      "لقد أعادت Compass بناء ثقتي بنفسي وأظهرت لي أنه يمكنني أن أحلم بما هو أكبر. لم يكن الأمر يتعلق فقط باكتساب المعرفة - بل كان الأمر يتعلق بالإيمان بإمكانياتي، وشغفي في كل مرة أشارك فيها بمسابقة يتجدد ليتنافس أنا وزملائي منافسة شريفة وممتعة مرة أخرى.",
  },
  {
    name: "عبدالله م.",
    initials: "ع",
    quote:
      "أشعر الآن بأنني أكثر استعدادًا لتولي أدوار قيادية، وقد بدأت بالفعل في توجيه بعض زملائي بفضل ما تعلمته من المرشد الأكاديمي على المنصة.",
  },
  {
    name: "نور س.",
    initials: "ن",
    quote:
      "الفرق الحقيقي كان بالمتابعة الشخصية. كل ما واجهت مشكلة بمشروعي، كان في مرشد يرد عليّ ويوجّهني خطوة بخطوة، مش بس محتوى مسجّل بنشاهده لحالنا.",
  },
  {
    name: "سارة و.",
    initials: "س",
    quote:
      "التقييم الصادق يلي بيعطيكي إياه المرشد بعد كل مشروع غيّر طريقة شغلي بالكامل. صرت بعرف نقاط ضعفي فعليًا وكيف أطورها، مش بس علامة بدون تفسير.",
  },
];

const Homepage = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroRef = useRef(null);
  const coursesRef = useRef(null);
  const resultsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const statsRef = useRef(null);

  const displayedCourses = showAllCourses ? coursesData : coursesData.slice(0, 6);

  const scrollToSection = (ref) => {
    setMobileMenuOpen(false);
    if (selectedCourse) {
      setSelectedCourse(null);
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } else {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => setSelectedCourse(null);

  return (
    <div className="page-wrapper">
      {/* شريط التنقل */}
      <nav className="navbar">
        <div className="nav-div">
          <div className="logo" onClick={() => scrollToSection(heroRef)} style={{ cursor: "pointer" }}>
            <CompassWordmark size={21} />
          </div>

          <ul className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <li onClick={() => scrollToSection(heroRef)}>Home</li>
            <li onClick={() => scrollToSection(coursesRef)}>Programs</li>
            <li onClick={() => scrollToSection(resultsRef)}>Learning Paths</li>
            <li onClick={() => scrollToSection(testimonialsRef)}>Instructors</li>
            <li onClick={() => navigate("/login")}>Pricing</li>
          </ul>

          <div className="nav-btns">
            <span className="login" onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>
              Login
            </span>
            <button className="get-started" onClick={() => navigate("/login")}>
              Get Started
            </button>
            <button
              className={`nav-hamburger ${mobileMenuOpen ? "open" : ""}`}
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      <div className="landing-page">
        {/* القسم الرئيسي */}
        {!selectedCourse && (
          <section className="hero" ref={heroRef}>
            <div className="hero-content">
              <div className="bearing-tag">
                <span className="bearing-tag-deg">N 45°</span>
                Future-Ready Engineering Platform
              </div>

              <h1>
                Navigate Your Future With{" "}
                <span className="highlight">Skills That Matter</span>
              </h1>

              <p>
                Master AI, technology, business, and future skills through
                structured learning paths, practical projects, certifications, and
                expert mentorship.
              </p>

              <div className="buttons">
                <button className="btn-primary" onClick={() => navigate("/login")}>
                  Start Learning Free
                </button>
                <button className="btn-secondary" onClick={() => navigate("/trainer-login")}>
                  Be a Coach
                </button>
              </div>

              <div className="features">
                <div className="features-column">
                  <span>Accredited Certificates</span>
                  <span>Expert instructors</span>
                </div>
                <div className="features-column">
                  <span>AI-powered learning</span>
                  <span>Career-focused curriculum</span>
                </div>
              </div>
            </div>

            <div className="hero-image-wrap">
              <div className="hero-image">
                <img src={heroImg} alt="Compass" />
              </div>
            </div>
          </section>
        )}

        {/* قسم الكورسات */}
        <section className="courses-section" ref={coursesRef}>
          {selectedCourse ? (
            <div className="hp-course-details">
              <button className="hp-back-button" onClick={handleBack}>
                ‹ Back to Courses
              </button>

              <div className="hp-details-card">
                <div className="hp-details-header">
                  <div className="hp-avatar large">{getInitials(selectedCourse.category)}</div>

                  <div className="hp-details-info">
                    <span className="hp-level">{selectedCourse.level}</span>
                    <p className="hp-category">{selectedCourse.category}</p>
                    <h2 className="hp-details-title">{selectedCourse.title}</h2>

                    <div className="hp-details-meta">
                      <span>⏱ {selectedCourse.duration}</span>
                      <span>📚 {selectedCourse.lessons} Lessons</span>
                      <span>
                        <span className="hp-star">★</span> {selectedCourse.rating} (
                        {selectedCourse.students} students)
                      </span>
                    </div>

                    <div className="hp-instructor">
                      <span className="hp-instructor-avatar">
                        {selectedCourse.instructor.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                      <span>{selectedCourse.instructor}</span>
                    </div>
                  </div>
                </div>

                <div className="hp-details-body">
                  <section className="hp-details-section">
                    <h3>About this course</h3>
                    <p>{selectedCourse.description}</p>
                  </section>

                  <section className="hp-details-section">
                    <h3>What you will learn</h3>
                    <ul className="hp-details-list">
                      {selectedCourse.whatYouWillLearn.map((item, i) => (
                        <li key={i}>
                          <span className="hp-check-icon">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="hp-details-section">
                    <h3>Requirements</h3>
                    <ul className="hp-details-list plain">
                      {selectedCourse.requirements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="hp-enroll-box">
                  <div className="hp-original-price">
                    <span className="hp-price-label">Course price</span>
                    <span className="hp-price-strikethrough">${selectedCourse.price}</span>
                  </div>
                  <button className="hp-enroll-free-btn" onClick={() => navigate("/login")}>
                    🎓 Learn for Free
                  </button>
                  <p className="hp-enroll-note">Sign in to enroll — it takes less than a minute</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="courses-header">
                <span className="section-tag">OUR PROGRAMS</span>
                <h2>Explore Our Courses</h2>
                <p>اختاري المسار اللي بيناسب هدفك، وابدأي رحلتك التعليمية بخطوات واضحة.</p>
              </div>

              <div className="hp-courses-grid">
                {displayedCourses.map((course) => (
                  <div key={course.id} className="hp-course-card" onClick={() => handleCourseClick(course)}>
                    <div className="hp-card-top">
                      <div className="hp-avatar">{getInitials(course.category)}</div>
                      <span className="hp-level">{course.level}</span>
                    </div>

                    <p className="hp-category">{course.category}</p>
                    <h3 className="hp-title">{course.title}</h3>

                    <div className="hp-meta">
                      <span>⏱ {course.duration}</span>
                      <span>📚 {course.lessons} Lessons</span>
                    </div>

                    <div className="hp-instructor">
                      <span className="hp-instructor-avatar">
                        {course.instructor.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                      <span>{course.instructor}</span>
                    </div>

                    <div className="hp-card-footer">
                      <div className="hp-rating">
                        <span className="hp-star">★</span>
                        <span>{course.rating}</span>
                        <span className="hp-students-count">({course.students})</span>
                      </div>
                      <div className="hp-price">${course.price}</div>
                    </div>
                  </div>
                ))}
              </div>

              {coursesData.length > 6 && (
                <div className="hp-view-all-wrap">
                  <button className="btn-secondary" onClick={() => setShowAllCourses((prev) => !prev)}>
                    {showAllCourses ? "Show Less" : "View All Courses"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* بانر النتائج */}
        {!selectedCourse && (
          <section className="results-section" ref={resultsRef}>
            <div className="results-banner">
              <div className="results-donut" style={{ "--percent": 91 }}>
                <span className="results-donut-value">91%</span>
              </div>
              <div className="results-banner-text">
                <h2>91% من طلاب Compass Academy حقّقوا نتائج أكاديمية ملموسة</h2>
                <p>
                  أبلغوا عن تطوّر واضح في مهاراتهم التقنية، وزيادة حقيقية في
                  معرفتهم العملية، وتحسّن ملحوظ في أدائهم الدراسي ومشاريعهم
                  التطبيقية بعد انضمامهم إلى المنصة.
                </p>
                <span className="results-link" onClick={() => scrollToSection(testimonialsRef)}>
                  اعرف المزيد
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 12H5M11 6l-6 6 6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </section>
        )}

        {/* لماذا يختار الطلاب كومباس */}
        {!selectedCourse && (
          <section className="testimonials-section" ref={testimonialsRef}>
            <div className="courses-header">
              <span className="section-tag">STUDENT VOICES</span>
              <h2>لماذا يختار الطلاب Compass Academy؟</h2>
              <p>
                لأنها ليست مجرد منصة كورسات — بل رحلة تعلّم موجّهة بالكامل.
                مرشد أكاديمي حقيقي يرافقك من الصفر حتى الاحتراف، يجاوب على
                أسئلتك، يساعدك تتجاوز عقبات مشروعك، ويمنحك تقييمًا صادقًا
                وواقعيًا لمستواك في كل مرحلة.
              </p>
            </div>

            <div className="testimonials-grid">
              {testimonials.map((t) => (
                <div className="testimonial-card" key={t.name}>
                  <div className="testimonial-header">
                    <span className="testimonial-avatar">{t.initials}</span>
                    <span className="testimonial-name">{t.name}</span>
                  </div>
                  <p className="testimonial-quote">"{t.quote}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* قسم الإحصائيات */}
        {!selectedCourse && (
          <section className="stats-section" ref={statsRef}>
            <div className="stat-card">
              <span className="bearing-letter">N</span>
              <h3>3350+</h3>
              <p>STUDENTS</p>
              <div className="stat-line"></div>
            </div>
            <div className="stat-card">
              <span className="bearing-letter">E</span>
              <h3>80+</h3>
              <p>COURSES</p>
              <div className="stat-line"></div>
            </div>
            <div className="stat-card">
              <span className="bearing-letter">S</span>
              <h3>23+</h3>
              <p>INSTRUCTORS</p>
              <div className="stat-line"></div>
            </div>
            <div className="stat-card">
              <span className="bearing-letter">W</span>
              <h3>61%</h3>
              <p>COMPLETION RATE</p>
              <div className="stat-line"></div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Homepage;