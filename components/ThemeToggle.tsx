import { useTheme } from '@/src/contexts/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <FontAwesome
          name={isDark ? 'moon-o' : 'sun-o'}
          size={20}
          color={theme.colors.primary}
        />
        <Text
          style={[
            styles.text,
            {
              color: theme.colors.textSecondary,
            },
          ]}
        >
          {isDark ? 'Modo Escuro' : 'Modo Claro'}
        </Text>
      </View>
      <View
        style={[
          styles.toggle,
          {
            backgroundColor: isDark ? theme.colors.primary : theme.colors.borderSecondary,
          },
        ]}
      >
        <View
          style={[
            styles.toggleCircle,
            {
              backgroundColor: '#fff',
              transform: [{ translateX: isDark ? 0 : 20 }],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 140,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    padding: 2,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
