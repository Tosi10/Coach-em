/**
 * Button Component
 * 
 * Componente de botão reutilizável seguindo o design system suíço.
 * 
 * Por que criar um componente separado?
 * - Consistência visual em todo o app
 * - Facilita manutenção (mudanças em um lugar)
 * - Type safety com TypeScript
 */

import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

/**
 * Props do componente Button
 * 
 * Usamos interface para definir as props porque:
 * - Facilita extensão (pode usar 'extends')
 * - Melhor para objetos que representam contratos
 * - Suporta optional properties com '?'
 */
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente Button
 * 
 * @param props - Props do botão
 * @returns Componente de botão estilizado
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  // Determina classes CSS baseado na variante
  // TypeScript garante que variant só pode ser um dos valores definidos
  const variantClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-neutral-600',
    outline: 'bg-transparent border-2 border-primary-600',
  };

  const textClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary-600',
  };

  return (
    <TouchableOpacity
      className={`${variantClasses[variant]} rounded-lg py-4 px-6 ${
        disabled || loading ? 'opacity-50' : ''
      } ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#0284c7' : '#ffffff'}
        />
      ) : (
        <Text className={`text-center font-semibold text-base ${textClasses[variant]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}




