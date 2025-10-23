import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../store/themeStore';
import { Movie } from '../utils/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.32;

interface MovieCardProps {
  movie: Movie;
  onPress: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onPress }) => {
  const { theme } = useThemeStore();

  return (
    <TouchableOpacity
      style={[styles.container, { marginRight: 12 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: movie.poster_path }}
        style={styles.poster}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      >
        <Text style={styles.rating}>⭐ {movie.vote_average.toFixed(1)}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'flex-end',
    padding: 8,
  },
  rating: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});