import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const getDefaultPathForRole = (role) => {
  switch (role) {
    case 'OPERARIO':
      return '/operario/estacion';
    case 'SUPERVISOR':
      return '/supervisor/dashboard';
    case 'ADMIN':
      return '/admin/configuracion';
    default:
      return '/login';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicialización de sesión desde localStorage y verificación contra /api/auth/perfil
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('nutriscan_token');
      const storedUser = localStorage.getItem('nutriscan_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verificar que el token sea criptográficamente válido en el backend
          const perfilRes = await authService.perfil();
          if (perfilRes && perfilRes.success && perfilRes.data) {
            setUser(perfilRes.data);
            localStorage.setItem('nutriscan_user', JSON.stringify(perfilRes.data));
          }
        } catch (err) {
          console.warn('Sesión previa inválida o expirada:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Escuchar evento global de deslogueo por 401
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('nutriscan:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('nutriscan:unauthorized', handleUnauthorized);
    };
  }, []);

  /**
   * Inicio de sesión conectado a POST /api/auth/login
   */
  const login = async (email, password) => {
    const response = await authService.login(email, password);

    if (response && response.success && response.data) {
      const { token: receivedToken, usuario } = response.data;
      setToken(receivedToken);
      setUser(usuario);
      localStorage.setItem('nutriscan_token', receivedToken);
      localStorage.setItem('nutriscan_user', JSON.stringify(usuario));
      return usuario;
    } else {
      throw new Error(response.message || 'Error al iniciar sesión');
    }
  };

  /**
   * Cierre de sesión y limpieza de tokens
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nutriscan_token');
    localStorage.removeItem('nutriscan_user');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    getDefaultPathForRole: () => getDefaultPathForRole(user?.rol),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
