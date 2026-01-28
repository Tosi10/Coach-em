import { useTheme } from '@/src/contexts/ThemeContext';

/**
 * Hook para obter classes Tailwind condicionais baseadas no tema
 * 
 * Retorna classes que mudam automaticamente com o tema atual
 */
export function useThemeClasses() {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  return {
    // Backgrounds
    bg: isDark ? 'bg-dark-950' : 'bg-white',
    bgSecondary: isDark ? 'bg-dark-900' : 'bg-gray-50',
    bgTertiary: isDark ? 'bg-dark-800' : 'bg-gray-100',
    
    // Text
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-neutral-400' : 'text-gray-600',
    textTertiary: isDark ? 'text-neutral-500' : 'text-gray-500',
    
    // Borders
    border: isDark ? 'border-dark-700' : 'border-gray-200',
    borderSecondary: isDark ? 'border-dark-600' : 'border-gray-300',
    
    // Cards
    card: isDark ? 'bg-dark-900' : 'bg-white',
    cardBorder: isDark ? 'border-dark-700' : 'border-gray-200',
    
    // Status
    isDark,
    theme,
  };
}
