import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5165/api';

console.log('🔗 Conectando na API:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ✅ Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erro 401 - Não autorizado (token expirado ou inválido)
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      console.error('❌ Erro na resposta:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      console.error('❌ Erro na requisição:', error.request);
      console.error('Verifique se a API está rodando em:', API_URL);
    } else {
      console.error('❌ Erro:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;