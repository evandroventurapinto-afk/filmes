import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const api = axios.create({
  baseURL: BACKEND_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().sessionToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export interface Movie {
  id: string;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  media_type: string;
  video_url?: string;
}

export const moviesApi = {
  getMovies: (category?: string) => 
    api.get<{ results: Movie[] }>('/api/movies', { params: { category } }),
  
  getMovie: (id: string) => 
    api.get<Movie>(`/api/movies/${id}`),
  
  searchMovies: (query: string) => 
    api.get<{ results: Movie[] }>('/api/movies/search', { params: { q: query } }),
};

export const favoritesApi = {
  getFavorites: () => 
    api.get<{ results: any[] }>('/api/favorites'),
  
  addFavorite: (movieId: string) => 
    api.post('/api/favorites', null, { params: { movie_id: movieId } }),
  
  removeFavorite: (movieId: string) => 
    api.delete(`/api/favorites/${movieId}`),
};

export const watchHistoryApi = {
  getWatchHistory: () => 
    api.get<{ results: any[] }>('/api/watch-history'),
  
  updateWatchHistory: (movieId: string, progress: number) => 
    api.post('/api/watch-history', null, { 
      params: { movie_id: movieId, progress } 
    }),
};