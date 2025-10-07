// ============================================
// src/services/motoristasService.js
// ============================================
import api from './api';

export const motoristasService = {
  getAll: async (params = {}) => {
    const response = await api.get('/motoristas', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/motoristas/${id}`);
    return response.data;
  },

  create: async (motorista) => {
    const response = await api.post('/motoristas', motorista);
    return response.data;
  },

  update: async (id, motorista) => {
    const response = await api.put(`/motoristas/${id}`, motorista);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/motoristas/${id}`);
    return response.data;
  },

  getDisponiveis: async () => {
    const response = await api.get('/motoristas/disponiveis');
    return response.data;
  },
};