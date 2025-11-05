import api from './api';

export const usuariosService = {
  async getAll() {
    const response = await api.get('/usuarios');
    return response.data;
  },

  async create(payload) {
    const response = await api.post('/usuarios', payload);
    return response.data;
  },

  async updatePassword(usuarioId, novaSenha) {
    const id = encodeURIComponent(usuarioId);
    const response = await api.put(`/usuarios/${id}/senha`, { novaSenha });
    return response.data;
  },

  async updateStatus(usuarioId, ativo) {
    const id = encodeURIComponent(usuarioId);
    const response = await api.patch(`/usuarios/${id}/status`, { ativo });
    return response.data;
  }
};
