import api from './api';

export const usuariosService = {
  async getAll() {
    const response = await api.get('/usuarios');
    return response.data;
  },

  async create(payload) {
    const response = await api.post('/usuarios', payload);
    return response.data;
  }
};
