import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length) {
    const userRole = user?.perfil;
    const hasAccess = userRole && allowedRoles.includes(userRole);

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;