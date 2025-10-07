// ============================================
// src/services/dashboardService.js
// ============================================
import api from './api';

export const dashboardService = {
  getEstatisticas: async () => {
    const response = await api.get('/dashboard/estatisticas');
    return response.data;
  },

  getViagensAtivas: async () => {
    const response = await api.get('/dashboard/viagens-ativas');
    return response.data;
  },

  getUltimasCargas: async (quantidade = 10) => {
    const response = await api.get(`/dashboard/ultimas-cargas?quantidade=${quantidade}`);
    return response.data;
  },

  getGraficoViagensMes: async () => {
    const response = await api.get('/dashboard/grafico-viagens-mes');
    return response.data;
  },
};