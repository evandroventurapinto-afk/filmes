import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';
import { moviesApi, favoritesApi, Movie } from '../../src/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';

const { width, height } = Dimensions.get('window');

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useThemeStore();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMovie();
      checkFavorite();
    }
  }, [id]);

  const fetchMovie = async () => {
    try {
      const response = await moviesApi.getMovie(id!);
      setMovie(response.data);
    } catch (error) {
      console.error('Error fetching movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await favoritesApi.getFavorites();
      const favorite = response.data.results.find(
        (f: any) => f.movie_id === id
      );
      setIsFavorite(!!favorite);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesApi.removeFavorite(id!);
        setIsFavorite(false);
      } else {
        await favoritesApi.addFavorite(id!);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handlePlayMovie = () => {
    if (movie?.video_url) {
      router.push({
        pathname: '/movie/player',
        params: {
          videoUrl: movie.video_url,
          title: movie.title,
          movieId: movie.id,
        },
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          Filme não encontrado
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        {/* Backdrop Image */}
        <View style={styles.backdropContainer}>
          <Image
            source={{ uri: movie.backdrop_path }}
            style={styles.backdrop}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', theme.background]}
            style={styles.gradient}
          />
          
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorite ? theme.primary : '#FFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Movie Info */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>{movie.title}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
            <Text style={[styles.year, { color: theme.textSecondary }]}>
              {movie.release_date.split('-')[0]}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.typeText}>
                {movie.media_type === 'movie' ? 'FILME' : 'SÉRIE'}
              </Text>
            </View>
          </View>

          {/* Play Button */}
          <View style={styles.actionContainer}>
            <Button
              title="Assistir Agora"
              onPress={handlePlayMovie}
              variant="primary"
              icon={<Ionicons name="play" size={20} color="#FFF" />}
            />
          </View>

          {/* Overview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Sinopse</Text>
            <Text style={[styles.overview, { color: theme.textSecondary }]}>
              {movie.overview}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdropContainer: {
    width: width,
    height: height * 0.5,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    marginTop: -30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  year: {
    fontSize: 16,
    marginRight: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionContainer: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  overview: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
});