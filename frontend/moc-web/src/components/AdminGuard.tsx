import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessAdmin } from '../utils/permissions';

type AdminGuardProps = {
  children: React.ReactNode;
};

/**
 * Renders children only if the current user can access Admin (SuperUser).
 * Otherwise redirects to dashboard.
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (!canAccessAdmin(user.roleKey)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
