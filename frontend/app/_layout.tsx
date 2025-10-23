import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../src/store/themeStore';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  const { theme, mode } = useThemeStore();

  useEffect(() => {
    StatusBar.setBarStyle(mode === 'dark' ? 'light-content' : 'dark-content');
  }, [mode]);

  return (
    <>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="movie" />
      </Stack>
    </>
  );
}
