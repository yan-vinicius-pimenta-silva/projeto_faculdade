import api from './api';

const excelService = {
  async exportData(resource) {
    const response = await api.get(`/${resource}/export`, {
      responseType: 'blob',
    });
    return response;
  },

  async importData(resource, file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/${resource}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

export default excelService;
