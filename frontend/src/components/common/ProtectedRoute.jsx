import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getDefaultPathForRole } from '../../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 1. Mientras valida la sesión inicial contra el backend
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <LoadingSpinner text="Validando credenciales de acceso..." size="lg" />
      </div>
    );
  }

  // 2. Si no hay sesión activa -> Redirección a Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Verificación de Roles (RBAC)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    const defaultPath = getDefaultPathForRole(user.rol);
    return (
      <Navigate 
        to={defaultPath} 
        state={{ 
          unauthorizedAttempt: true,
          requestedPath: location.pathname,
          requiredRoles: allowedRoles
        }} 
        replace 
      />
    );
  }

  return children;
};
