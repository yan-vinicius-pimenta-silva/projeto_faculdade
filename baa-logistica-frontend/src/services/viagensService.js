// ============================================
// src/services/viagensService.js
// ============================================
import api from './api';

export const viagensService = {
  getAll: async (params = {}) => {
    const response = await api.get('/viagens', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/viagens/${id}`);
    return response.data;
  },

  create: async (viagem) => {
    const response = await api.post('/viagens', viagem);
    return response.data;
  },

  update: async (id, viagem) => {
    const response = await api.put(`/viagens/${id}`, viagem);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/viagens/${id}`);
    return response.data;
  },
};