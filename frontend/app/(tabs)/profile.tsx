import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { theme, mode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* User Info */}
      <View style={[styles.userSection, { backgroundColor: theme.surface }]}>
        <Image
          source={{ uri: user?.picture }}
          style={styles.avatar}
        />
        <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Configurações</Text>
        
        {/* Theme Toggle */}
        <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
          <View style={styles.settingLeft}>
            <Ionicons
              name={mode === 'dark' ? 'moon' : 'sunny'}
              size={24}
              color={theme.primary}
            />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Tema {mode === 'dark' ? 'Escuro' : 'Claro'}
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                Alterar aparência do app
              </Text>
            </View>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sobre</Text>
        
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card }]}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Versão</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                1.0.0
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.card }]}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle" size={24} color={theme.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Ajuda & Suporte</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.card }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out" size={24} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>Sair</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userSection: {
    alignItems: 'center',
    padding: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});