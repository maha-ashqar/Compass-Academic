import { Navigate } from 'react-router-dom';

function StudentProtectedRoute({
  isAuthenticated,
  isCheckingAuth,
  children,
}) {
  if (isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default StudentProtectedRoute;