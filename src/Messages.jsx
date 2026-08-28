import ChatApp from './ChatApp';

/**
 * Student-side messaging. All the actual UI and logic live in ChatApp —
 * this file just tells it which role and which identity to use, so
 * conversations resolve to the same shared records the trainer side reads.
 * Wrapped in .chat-page-wrap because StudentDashboard's .dashboard-body
 * has no padding of its own (unlike the trainer dashboard's).
 */
export default function Messages({ studentData }) {
  return (
    <div className="chat-page-wrap">
      <ChatApp role="student" currentUser={studentData} />
    </div>
  );
}
