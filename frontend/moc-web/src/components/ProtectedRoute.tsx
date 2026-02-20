import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

/**
 * Wraps routes that require authentication. Redirects to /login with returnTo if not logged in.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'} replace />;
  }

  return <>{children}</>;
}
