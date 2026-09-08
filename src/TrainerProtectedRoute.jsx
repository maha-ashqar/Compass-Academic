import { Navigate } from 'react-router-dom';

function TrainerProtectedRoute({
  isAuthenticated,
  isCheckingAuth,
  children,
}) {
  if (isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/trainer-login"
        replace
      />
    );
  }

  return children;
}

export default TrainerProtectedRoute;