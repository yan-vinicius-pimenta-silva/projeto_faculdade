import api from './api';

const authService = {
  // Login
  async login(login, senha) {
    try {
      const response = await api.post('/auth/login', { login, senha });

      // Salvar token e dados do usuário
      if (response.data.token) {
        const currentUser = this.getCurrentUser();
        const avatar = response.data.avatar ?? currentUser?.avatar ?? '';

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          nome: response.data.nome,
          email: response.data.email,
          perfil: response.data.perfil,
          avatar
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

  // Atualizar dados do usuário salvo
  updateCurrentUser(updates = {}) {
    const currentUser = this.getCurrentUser();
    const updatedUser = {
      ...(currentUser || {}),
      ...updates
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
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

  async atualizarAvatar(avatarBase64) {
    try {
      const response = await api.put('/auth/avatar', { avatarBase64 });
      this.updateCurrentUser({ avatar: response.data.avatar ?? avatarBase64 });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erro ao atualizar foto de perfil';
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