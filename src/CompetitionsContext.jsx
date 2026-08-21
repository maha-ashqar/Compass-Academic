/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { competitionsData } from './competitionsData';

const CompetitionsContext = createContext(null);
const COMPETITIONS_KEY = 'compass_competitions_v3';
const REGISTRATIONS_KEY = 'compass_competition_registrations_v3';
const SUBMISSIONS_KEY = 'compass_competition_submissions_v3';

export const COMPETITION_PHASE = {
  DRAFT: 'draft', REGISTRATION_OPEN: 'registration-open', REGISTRATION_CLOSED: 'registration-closed',
  SUBMISSIONS_OPEN: 'submissions-open', JUDGING: 'judging', RESULTS_PUBLISHED: 'results-published', COMPLETED: 'completed',
};

const now = () => new Date().toISOString();
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
// Older versions of the app stored some competition data as objects (or as a
// list of ids). Always migrate that data to arrays before the UI uses .filter,
// .map, or .some. This also prevents a damaged localStorage entry from taking
// down both the student and trainer dashboards.
const readArrayStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.items)) return parsed.items;

    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed).filter((item) => item != null);
    }

    return fallback;
  } catch {
    return fallback;
  }
};

const normalizeCompetition = (item, index) => (
  item && typeof item === 'object'
    ? { ...item, id: String(item.id ?? `competition-${index + 1}`) }
    : null
);

const normalizeRegistration = (item, index) => {
  if (item && typeof item === 'object') {
    return {
      type: 'individual',
      members: [],
      status: 'pending',
      createdAt: now(),
      ...item,
      id: String(item.id ?? `registration-${index + 1}`),
      competitionId: String(item.competitionId ?? item.competition ?? ''),
    };
  }

  // Legacy format: [competitionId, competitionId, ...]
  return {
    id: `legacy-registration-${index + 1}-${String(item)}`,
    competitionId: String(item),
    type: 'individual',
    members: [],
    status: 'pending',
    createdAt: now(),
  };
};

const normalizeSubmission = (item, index) => (
  item && typeof item === 'object'
    ? {
        files: [],
        links: {},
        rubricScores: {},
        status: 'submitted',
        ...item,
        id: String(item.id ?? `submission-${index + 1}`),
        competitionId: String(item.competitionId ?? item.competition ?? ''),
      }
    : null
);

const seedCompetitions = competitionsData.map((item, index) => ({
  ...item, id: String(item.id), status: 'published',
  phase: index === 0 ? COMPETITION_PHASE.REGISTRATION_OPEN : index === 1 ? COMPETITION_PHASE.SUBMISSIONS_OPEN : index === 2 ? COMPETITION_PHASE.JUDGING : COMPETITION_PHASE.COMPLETED,
  participationType: item.teamSize?.toLowerCase().includes('individual') ? 'individual' : 'individual-or-team',
  registrationOpenAt: item.timeline?.[0]?.date || item.startDate, registrationCloseAt: item.registrationDeadline,
  submissionOpenAt: item.startDate, submissionCloseAt: item.endDate, resultsAt: item.timeline?.at(-1)?.date || item.endDate,
  maxTeamMembers: Number(item.teamSize?.match(/\d+/g)?.at(-1)) || 1,
  applicationsCount: index === 0 ? 18 : 0, submissionsCount: index === 1 ? 12 : index === 2 ? 9 : 0,
  createdAt: now(), updatedAt: now(),
}));

const seedRegistrations = [
  { id: 'registration-1', competitionId: '1', studentId: 'STU-1001', studentName: 'Maha Alashqar', studentEmail: 'maha@university.edu.sa', type: 'team', teamName: 'Team Orbit', members: [{ name: 'Maha Alashqar', role: 'Team lead' }, { name: 'Omar Fares', role: 'Developer' }], status: 'pending', createdAt: now() },
  { id: 'registration-2', competitionId: '1', studentId: 'STU-1002', studentName: 'Lina Aboud', studentEmail: 'lina@university.edu.sa', type: 'individual', members: [], status: 'pending', createdAt: now() },
];
const seedSubmissions = [
  { id: 'submission-1', competitionId: '2', registrationId: 'registration-approved-1', studentName: 'Maha Alashqar', teamName: 'Team Orbit', title: 'Campus Services Portal', description: 'A digital campus services experience.', files: [], links: { demo: '#', github: '#' }, status: 'submitted', rubricScores: {}, finalScore: 0, feedback: '', submittedAt: now() },
];

export function CompetitionsProvider({ children }) {
  const [competitions, setCompetitions] = useState(() =>
    readArrayStorage(COMPETITIONS_KEY, seedCompetitions)
      .map(normalizeCompetition)
      .filter(Boolean)
  );
  const [registrations, setRegistrations] = useState(() =>
    readArrayStorage(REGISTRATIONS_KEY, seedRegistrations)
      .map(normalizeRegistration)
      .filter((item) => item.competitionId)
  );
  const [submissions, setSubmissions] = useState(() =>
    readArrayStorage(SUBMISSIONS_KEY, seedSubmissions)
      .map(normalizeSubmission)
      .filter(Boolean)
  );

  useEffect(() => localStorage.setItem(COMPETITIONS_KEY, JSON.stringify(competitions)), [competitions]);
  useEffect(() => localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations)), [registrations]);
  useEffect(() => localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions)), [submissions]);

  const mutateCompetition = useCallback((id, updater) => setCompetitions((items) => items.map((item) => String(item.id) === String(id) ? { ...updater(item), updatedAt: now() } : item)), []);
  const createCompetition = useCallback((data) => {
    const item = { id: uid('competition'), title: '', description: '', category: '', organizer: 'Compass Academy', status: 'draft', phase: COMPETITION_PHASE.DRAFT, participationType: 'individual-or-team', maxTeamMembers: 5, registrationOpenAt: '', registrationCloseAt: '', submissionOpenAt: '', submissionCloseAt: '', resultsAt: '', prize: '', requirements: [], rules: [], applicationsCount: 0, submissionsCount: 0, createdAt: now(), updatedAt: now(), ...data };
    setCompetitions((items) => [item, ...items]); return item;
  }, []);
  const updateCompetition = useCallback((id, data) => { mutateCompetition(id, (item) => ({ ...item, ...data, id: item.id })); return { ok: true }; }, [mutateCompetition]);
  const publishCompetition = useCallback((id) => mutateCompetition(id, (item) => ({ ...item, status: 'published', phase: item.phase === COMPETITION_PHASE.DRAFT ? COMPETITION_PHASE.REGISTRATION_OPEN : item.phase })), [mutateCompetition]);
  const closeCompetition = useCallback((id) => mutateCompetition(id, (item) => ({ ...item, phase: COMPETITION_PHASE.COMPLETED })), [mutateCompetition]);
  const deleteCompetition = useCallback((id) => setCompetitions((items) => items.filter((item) => String(item.id) !== String(id))), []);
  const getTrainerCompetitions = useCallback(() => competitions, [competitions]);
  const getCompetitionById = useCallback((id) => competitions.find((item) => String(item.id) === String(id)) || null, [competitions]);

  const getRegistrationRequests = useCallback((competitionId) => registrations.filter((item) => String(item.competitionId) === String(competitionId)), [registrations]);
  const setRegistrationStatus = useCallback((id, status, reason = '') => setRegistrations((items) => items.map((item) => item.id === id ? { ...item, status, reason, reviewedAt: now() } : item)), []);
  const approveRegistration = useCallback((id) => setRegistrationStatus(id, 'approved'), [setRegistrationStatus]);
  const rejectRegistration = useCallback((id, reason) => { if (!reason?.trim()) return { ok: false, error: 'A rejection reason is required.' }; setRegistrationStatus(id, 'rejected', reason); return { ok: true }; }, [setRegistrationStatus]);
  const approveIndividualParticipant = approveRegistration;
  const approveTeamRegistration = approveRegistration;
  const updateTeamMembers = useCallback((id, members) => setRegistrations((items) => items.map((item) => item.id === id ? { ...item, members } : item)), []);
  const registerForCompetition = useCallback((competitionId, participant = {}) => {
    const existing = registrations.find((item) => String(item.competitionId) === String(competitionId) && item.studentEmail?.toLowerCase() === participant.studentEmail?.toLowerCase());
    if (existing) return existing;
    const request = { id: uid('registration'), competitionId: String(competitionId), type: 'individual', members: [], status: 'pending', createdAt: now(), ...participant };
    setRegistrations((items) => [request, ...items]); return request;
  }, [registrations]);
  const unregister = useCallback((competitionId, studentEmail = '') => setRegistrations((items) => items.filter((item) => !(String(item.competitionId) === String(competitionId) && (!studentEmail || item.studentEmail?.toLowerCase() === studentEmail.toLowerCase())))), []);
  const isRegistered = useCallback((id, email = '') => registrations.some((item) => String(item.competitionId) === String(id) && item.status !== 'rejected' && (!email || item.studentEmail?.toLowerCase() === email.toLowerCase())), [registrations]);
  const isRegistrationApproved = useCallback((id, email = '') => registrations.some((item) => String(item.competitionId) === String(id) && item.status === 'approved' && (!email || item.studentEmail?.toLowerCase() === email.toLowerCase())), [registrations]);
  const register = useCallback((id, participant = {}) => registerForCompetition(id, participant), [registerForCompetition]);

  const getCompetitionSubmissions = useCallback((competitionId) => submissions.filter((item) => String(item.competitionId) === String(competitionId) && item.status !== 'deleted'), [submissions]);
  const getSubmissionById = useCallback((id) => submissions.find((item) => item.id === id) || null, [submissions]);
  const mutateSubmission = useCallback((id, updater) => setSubmissions((items) => items.map((item) => item.id === id ? { ...updater(item), updatedAt: now() } : item)), []);
  const approveSubmission = useCallback((id) => mutateSubmission(id, (item) => ({ ...item, status: 'approved' })), [mutateSubmission]);
  const requestSubmissionChanges = useCallback((id, feedback) => mutateSubmission(id, (item) => ({ ...item, status: 'changes-requested', feedback })), [mutateSubmission]);
  const deleteSubmission = useCallback((id, reason) => { if (!reason?.trim()) return { ok: false, error: 'A deletion reason is required.' }; mutateSubmission(id, (item) => ({ ...item, status: 'deleted', deleteReason: reason, deletedAt: now() })); return { ok: true }; }, [mutateSubmission]);
  const calculateFinalScore = useCallback((scores = {}) => Object.values(scores).reduce((total, score) => total + (Number(score) || 0), 0), []);
  const saveSubmissionScore = useCallback((id, rubricScores) => mutateSubmission(id, (item) => ({ ...item, rubricScores, finalScore: calculateFinalScore(rubricScores), status: 'scored' })), [calculateFinalScore, mutateSubmission]);
  const addSubmissionFeedback = useCallback((id, feedback) => mutateSubmission(id, (item) => ({ ...item, feedback })), [mutateSubmission]);

  const calculateCompetitionRanking = useCallback((competitionId) => getCompetitionSubmissions(competitionId).filter((item) => ['scored', 'approved'].includes(item.status)).sort((a, b) => Number(b.finalScore) - Number(a.finalScore)).map((item, index) => ({ ...item, rank: item.rank || index + 1 })), [getCompetitionSubmissions]);
  const assignParticipantRank = useCallback((id, rank) => mutateSubmission(id, (item) => ({ ...item, rank: Number(rank) })), [mutateSubmission]);
  const publishCompetitionResults = useCallback((id) => mutateCompetition(id, (item) => ({ ...item, phase: COMPETITION_PHASE.RESULTS_PUBLISHED, resultsPublishedAt: now() })), [mutateCompetition]);
  const exportCompetitionResults = useCallback((id) => {
    const rows = [['Rank', 'Participant', 'Project', 'Score'], ...calculateCompetitionRanking(id).map((item) => [item.rank, item.teamName || item.studentName, item.title, item.finalScore])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'competition-results.csv'; link.click(); URL.revokeObjectURL(url);
  }, [calculateCompetitionRanking]);

  const openRegistration = useCallback((id) => mutateCompetition(id, (item) => ({ ...item, status: 'published', phase: COMPETITION_PHASE.REGISTRATION_OPEN })), [mutateCompetition]);
  const closeRegistrationAutomatically = useCallback((id) => mutateCompetition(id, (item) => ({ ...item, phase: COMPETITION_PHASE.REGISTRATION_CLOSED })), [mutateCompetition]);
  const openSubmissionPeriod = useCallback((id) => mutateCompetition(id, (item) => ({ ...item, phase: COMPETITION_PHASE.SUBMISSIONS_OPEN })), [mutateCompetition]);
  const closeSubmissionsAutomatically = useCallback((id) => mutateCompetition(id, (item) => ({ ...item, phase: COMPETITION_PHASE.JUDGING })), [mutateCompetition]);
  const extendCompetitionDeadline = useCallback((id, newDeadline) => mutateCompetition(id, (item) => ({ ...item, submissionCloseAt: newDeadline, endDate: newDeadline })), [mutateCompetition]);

  const publishedCompetitions = useMemo(() => competitions.filter((item) => item.status === 'published'), [competitions]);
  const registeredIds = useMemo(() => [...new Set(registrations.filter((item) => item.status !== 'rejected').map((item) => item.competitionId))], [registrations]);
  const value = { competitions, publishedCompetitions, registrations, submissions, registeredIds, createCompetition, updateCompetition, publishCompetition, closeCompetition, deleteCompetition, getTrainerCompetitions, getCompetitionById, getRegistrationRequests, approveRegistration, rejectRegistration, approveIndividualParticipant, approveTeamRegistration, updateTeamMembers, registerForCompetition, register, unregister, isRegistered, isRegistrationApproved, getCompetitionSubmissions, getSubmissionById, approveSubmission, requestSubmissionChanges, deleteSubmission, saveSubmissionScore, addSubmissionFeedback, calculateFinalScore, calculateCompetitionRanking, assignParticipantRank, publishCompetitionResults, exportCompetitionResults, openRegistration, closeRegistrationAutomatically, openSubmissionPeriod, closeSubmissionsAutomatically, extendCompetitionDeadline };
  return <CompetitionsContext.Provider value={value}>{children}</CompetitionsContext.Provider>;
}

export function useCompetitions() {
  const context = useContext(CompetitionsContext);
  if (!context) throw new Error('useCompetitions must be used within a CompetitionsProvider');
  return context;
}