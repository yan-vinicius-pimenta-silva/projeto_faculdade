import api from './api';

const authService = {
  // Login
  async login(login, senha) {
    try {
      const response = await api.post('/auth/login', { login, senha });
      
      // Salvar token e dados do usuário
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          nome: response.data.nome,
          email: response.data.email,
          perfil: response.data.perfil
        }));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao fazer login';
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Obter token
  getToken() {
    return localStorage.getItem('token');
  },

  // Obter usuário atual
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Verificar se está autenticado
  isAuthenticated() {
    return !!this.getToken();
  },

  // Alterar senha
  async alterarSenha(senhaAtual, novaSenha) {
    try {
      const response = await api.post('/auth/alterar-senha', {
        senhaAtual,
        novaSenha
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao alterar senha';
    }
  },

  // Obter dados do usuário logado
  async getMe() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;