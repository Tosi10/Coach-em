import { ThemeColors } from '@/src/contexts/ThemeContext';

/**
 * Helper para criar estilos dinâmicos baseados no tema
 * 
 * Retorna objetos de estilo que podem ser aplicados via prop `style`
 */
export function getThemeStyles(colors: ThemeColors) {
  return {
    // Backgrounds
    bg: { backgroundColor: colors.background },
    bgSecondary: { backgroundColor: colors.backgroundSecondary },
    bgTertiary: { backgroundColor: colors.backgroundTertiary },
    bgCard: { backgroundColor: colors.card },
    
    // Text
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
    textTertiary: { color: colors.textTertiary },
    
    // Borders
    border: { borderColor: colors.border },
    borderSecondary: { borderColor: colors.borderSecondary },
    
    // Card styles combinados
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    cardSecondary: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.border,
    },
  };
}

/**
 * Helper para combinar classes Tailwind com estilos do tema
 * 
 * Útil quando você quer manter algumas classes Tailwind mas aplicar tema em cores específicas
 */
export function combineThemeStyles(
  colors: ThemeColors,
  baseStyles: any = {}
) {
  return {
    ...baseStyles,
    backgroundColor: colors.card,
    borderColor: colors.border,
  };
}
