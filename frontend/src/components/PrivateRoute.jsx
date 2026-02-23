import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('PrivateRoute - Auth:', { isAuthenticated, user, loading });
  console.log('PrivateRoute - adminOnly:', adminOnly);
  console.log('PrivateRoute - user.is_staff:', user?.is_staff);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user?.is_staff) {
    console.log('Not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('Access granted to protected route');
  return children;
};

export default PrivateRoute;