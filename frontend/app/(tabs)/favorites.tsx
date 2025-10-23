import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useThemeStore } from '../../src/store/themeStore';
import { favoritesApi } from '../../src/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    try {
      const response = await favoritesApi.getFavorites();
      setFavorites(response.data.results);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleRemove = async (movieId: string) => {
    try {
      await favoritesApi.removeFavorite(movieId);
      setFavorites(favorites.filter(f => f.movie_id !== movieId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const renderFavoriteItem = ({ item }: { item: any }) => {
    const movie = item.movie_data;
    return (
      <TouchableOpacity
        style={[styles.movieItem, { backgroundColor: theme.card }]}
        onPress={() => router.push(`/movie/${movie.id}`)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: movie.poster_path }}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.movieInfo}>
          <Text style={[styles.movieTitle, { color: theme.text }]} numberOfLines={2}>
            {movie.title}
          </Text>
          <Text style={[styles.movieOverview, { color: theme.textSecondary }]} numberOfLines={2}>
            {movie.overview}
          </Text>
          <View style={styles.movieMeta}>
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
            <Text style={[styles.year, { color: theme.textSecondary }]}>
              {movie.release_date.split('-')[0]}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(movie.id)}
        >
          <Ionicons name="heart" size={24} color={theme.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.movie_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Nenhum favorito ainda
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Adicione filmes e séries aos seus favoritos
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  movieItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  poster: {
    width: 100,
    height: 150,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    paddingRight: 40,
  },
  movieOverview: {
    fontSize: 14,
    lineHeight: 20,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  year: {
    fontSize: 14,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});