import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se tem usuário logado ao carregar a aplicação
    const loadUser = () => {
      const currentUser = authService.getCurrentUser();
      const token = authService.getToken();

      if (currentUser && token) {
        setUser(currentUser);
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (loginData, senha) => {
    try {
      const response = await authService.login(loginData, senha);
      const updatedUser = authService.getCurrentUser();
      setUser(updatedUser);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user && !!authService.getToken();
  };

  const updateUserProfile = (updates) => {
    const updatedUser = authService.updateCurrentUser(updates);
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        loading,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};