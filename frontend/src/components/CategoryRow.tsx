import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { Movie } from '../utils/api';
import { MovieCard } from './MovieCard';
import { useRouter } from 'expo-router';

interface CategoryRowProps {
  title: string;
  movies: Movie[];
}

export const CategoryRow: React.FC<CategoryRowProps> = ({ title, movies }) => {
  const { theme } = useThemeStore();
  const router = useRouter();

  const handlePress = (movie: Movie) => {
    router.push(`/movie/${movie.id}`);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <FlatList
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MovieCard movie={item} onPress={() => handlePress(item)} />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 16,
  },
  list: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});