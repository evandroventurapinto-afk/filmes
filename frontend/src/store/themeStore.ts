import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { lightTheme, darkTheme, Theme } from '../constants/theme';

const storage = createMMKV();

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // Load saved theme (only on client side)
  let savedTheme: ThemeMode | undefined;
  try {
    savedTheme = storage.getString('theme') as ThemeMode | undefined;
  } catch (error) {
    // Ignore storage errors on server side
    savedTheme = undefined;
  }
  const initialMode = savedTheme || 'dark';
  
  return {
    mode: initialMode,
    theme: initialMode === 'dark' ? darkTheme : lightTheme,
    toggleTheme: () => set((state) => {
      const newMode = state.mode === 'dark' ? 'light' : 'dark';
      storage.set('theme', newMode);
      return {
        mode: newMode,
        theme: newMode === 'dark' ? darkTheme : lightTheme,
      };
    }),
    setTheme: (mode: ThemeMode) => set(() => {
      storage.set('theme', mode);
      return {
        mode,
        theme: mode === 'dark' ? darkTheme : lightTheme,
      };
    }),
  };
});