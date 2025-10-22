import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Content API
export const contentAPI = {
  getAll: (params) => api.get('/content', { params }),
  getFeatured: () => api.get('/content/featured'),
  getTrending: () => api.get('/content/trending'),
  getGenres: () => api.get('/content/genres'),
  getByGenre: (genre, limit = 20) => api.get(`/content/by-genre/${genre}`, { params: { limit } }),
  getById: (id) => api.get(`/content/${id}`),
  getEpisode: (id) => api.get(`/content/episodes/${id}`),
};

// Subscription API
export const subscriptionAPI = {
  create: (paymentMethod) => api.post('/subscriptions/create', { payment_method: paymentMethod }),
  getMy: () => api.get('/subscriptions/my-subscription'),
  cancel: (id) => api.post(`/subscriptions/${id}/cancel`),
};

// Payment API
export const paymentAPI = {
  createPixPayment: (subscriptionId) => api.post('/payments/create-pix-payment', {
    subscription_id: subscriptionId,
    payment_method: 'pix'
  }),
  getMyPayments: () => api.get('/payments/my-payments'),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  getWatchHistory: () => api.get('/users/watch-history'),
  updateWatchHistory: (contentId, progressSeconds, episodeId = null) => 
    api.post('/users/watch-history', null, {
      params: { content_id: contentId, progress_seconds: progressSeconds, episode_id: episodeId }
    }),
};

// Admin API
export const adminAPI = {
  // Content management
  createContent: (data) => api.post('/admin/content', data),
  updateContent: (id, data) => api.put(`/admin/content/${id}`, data),
  deleteContent: (id) => api.delete(`/admin/content/${id}`),
  
  // Episode management
  createEpisode: (data) => api.post('/admin/episode', data),
  
  // User management
  getUsers: (params) => api.get('/admin/users', { params }),
  
  // Subscription management
  getSubscriptions: (params) => api.get('/admin/subscriptions', { params }),
  
  // Analytics
  getOverview: () => api.get('/admin/analytics/overview'),
  getRevenue: () => api.get('/admin/analytics/revenue'),
};
