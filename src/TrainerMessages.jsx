import ChatApp from './ChatApp';

/**
 * Trainer-side messaging. Same ChatApp component as Messages.jsx (student
 * side) — only the role and identity differ. A message a student sends
 * here is the exact same record the student sees on their side; there is
 * no separate trainer-only mock dataset anymore.
 *
 * `trainerData` must be passed in from TrainerDashboard.jsx, the same way
 * it's already passed into TrainerProjects (`<TrainerProjects trainerData={trainerData} />`).
 * If TrainerDashboard.jsx doesn't render this component with that prop yet,
 * update its route/tab for Messages to:
 *   <TrainerMessages trainerData={trainerData} />
 */
export default function TrainerMessages({ trainerData }) {
  return <ChatApp role="trainer" currentUser={trainerData} />;
}
