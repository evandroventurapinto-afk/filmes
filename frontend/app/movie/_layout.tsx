import React from 'react';
import { Stack } from 'expo-router';
import { useThemeStore } from '../../src/store/themeStore';

export default function MovieLayout() {
  const { theme } = useThemeStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="player"
        options={{
          title: 'Player',
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}