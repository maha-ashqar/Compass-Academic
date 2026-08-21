export const portfolioRecords = {
  default: {
    academicYear: '2025 / 2026',
    expectedGraduation: 'June 2027',
    trainings: [
      { id: 'training-react', title: 'Advanced React Development', provider: 'Compass Academy', hours: 40, completedAt: '2026-02-18', verified: true },
      { id: 'training-api', title: 'RESTful APIs with Node.js', provider: 'Compass Academy', hours: 32, completedAt: '2026-04-09', verified: true },
    ],
    evaluations: [
      { id: 'evaluation-1', mentor: 'Eng. Ahmad Khalil', title: 'Software Engineering Instructor', score: 94, note: 'Demonstrates strong engineering judgment, reliable delivery, and thoughtful attention to product quality.', verified: true, issuedAt: '2026-06-18' },
      { id: 'evaluation-2', mentor: 'Dr. Sarah Al-Mansour', title: 'Academic Advisor', score: 92, note: 'A proactive learner who communicates clearly and turns feedback into measurable improvements.', verified: true, issuedAt: '2026-07-02' },
    ],
    competitionResults: {
      1: 'Participant',
      2: 'Finalist',
      3: 'Participant',
      4: 'Participant',
      6: 'Participant',
    },
  },
};

export const getPortfolioRecord = (email) =>
  portfolioRecords[String(email || '').toLowerCase()] || portfolioRecords.default;