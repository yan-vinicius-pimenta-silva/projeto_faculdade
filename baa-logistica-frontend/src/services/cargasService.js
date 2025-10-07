// ============================================
// src/services/cargasService.js
// ============================================
import api from './api';

export const cargasService = {
  getAll: async (params = {}) => {
    const response = await api.get('/cargas', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/cargas/${id}`);
    return response.data;
  },

  create: async (carga) => {
    const response = await api.post('/cargas', carga);
    return response.data;
  },

  update: async (id, carga) => {
    const response = await api.put(`/cargas/${id}`, carga);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/cargas/${id}`);
    return response.data;
  },
};
