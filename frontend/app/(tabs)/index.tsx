import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useThemeStore } from '../../src/store/themeStore';
import { moviesApi, Movie } from '../../src/utils/api';
import { CategoryRow } from '../../src/components/CategoryRow';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { theme } = useThemeStore();
  const router = useRouter();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMovies = async () => {
    try {
      const [trendingRes, moviesRes, tvRes] = await Promise.all([
        moviesApi.getMovies('trending'),
        moviesApi.getMovies('movies'),
        moviesApi.getMovies('tv'),
      ]);

      setTrending(trendingRes.data.results);
      setMovies(moviesRes.data.results);
      setTvShows(tvRes.data.results);
      
      if (trendingRes.data.results.length > 0) {
        setFeatured(trendingRes.data.results[0]);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMovies();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
    >
      {/* Featured Content */}
      {featured && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/movie/${featured.id}`)}
        >
          <View style={styles.featuredContainer}>
            <Image
              source={{ uri: featured.backdrop_path }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', theme.background]}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredContent}>
                <Text style={[styles.featuredTitle, { color: theme.text }]}>
                  {featured.title}
                </Text>
                <View style={styles.featuredInfo}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {featured.vote_average.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={[styles.featuredYear, { color: theme.textSecondary }]}>
                    {featured.release_date.split('-')[0]}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: theme.primary }]}
                  onPress={() => router.push(`/movie/${featured.id}`)}
                >
                  <Ionicons name="play" size={24} color="#FFF" />
                  <Text style={styles.playButtonText}>Assistir Agora</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      )}

      {/* Categories */}
      <View style={styles.categories}>
        <CategoryRow title="Em Alta" movies={trending} />
        <CategoryRow title="Filmes" movies={movies} />
        <CategoryRow title="Séries" movies={tvShows} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  featuredContainer: {
    width: width,
    height: height * 0.6,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
  },
  featuredContent: {
    padding: 16,
    paddingBottom: 24,
  },
  featuredTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 8,
  },
  featuredInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  featuredYear: {
    fontSize: 14,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  categories: {
    paddingTop: 16,
  },
});