import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { Button } from '../src/components/Button';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAuthenticated, isLoading, checkAuth, login } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const init = async () => {
      // Check for session_id in URL (after Google OAuth)
      const url = await Linking.getInitialURL();
      if (url) {
        const { queryParams } = Linking.parse(url);
        const sessionId = queryParams?.session_id as string;
        
        if (sessionId) {
          try {
            await login(sessionId);
            router.replace('/(tabs)');
            return;
          } catch (error) {
            console.error('Login failed:', error);
          }
        }
      }

      // Check existing auth
      await checkAuth();
    };

    init();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  const handleLogin = () => {
    const redirectUrl = Linking.createURL('/(tabs)');
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    Linking.openURL(authUrl);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[theme.background, theme.surface]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.primary }]}>STREAMFLIX</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Assista a filmes e séries ilimitados
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem
            icon="🎬"
            title="Conteúdo Ilimitado"
            description="Milhares de filmes e séries"
            theme={theme}
          />
          <FeatureItem
            icon="⭐"
            title="Seus Favoritos"
            description="Salve e organize seu conteúdo"
            theme={theme}
          />
          <FeatureItem
            icon="🌞"
            title="Temas Personalizados"
            description="Claro ou escuro, você escolhe"
            theme={theme}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Entrar com Google"
            onPress={handleLogin}
            variant="primary"
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const FeatureItem = ({ icon, title, description, theme }: any) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={[styles.featureTitle, { color: theme.text }]}>{title}</Text>
    <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
      {description}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
});