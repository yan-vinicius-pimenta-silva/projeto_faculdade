// ============================================
// src/services/veiculosService.js
// ============================================
import api from './api';

export const veiculosService = {
  getAll: async (params = {}) => {
    const response = await api.get('/veiculos', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/veiculos/${id}`);
    return response.data;
  },

  create: async (veiculo) => {
    const response = await api.post('/veiculos', veiculo);
    return response.data;
  },

  update: async (id, veiculo) => {
    const response = await api.put(`/veiculos/${id}`, veiculo);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/veiculos/${id}`);
    return response.data;
  },

  getDisponiveis: async () => {
    const response = await api.get('/veiculos/disponiveis');
    return response.data;
  },
};
