import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  cancelText?: string;
}

export function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  onConfirm,
  onCancel,
  showCancel = false,
  cancelText = 'Cancelar',
}: CustomAlertProps) {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const typeConfig = {
    success: {
      icon: 'check-circle' as const,
      iconColor: '#10b981',
      bgColor: '#10b981',
      borderColor: '#10b981',
    },
    error: {
      icon: 'exclamation-circle' as const,
      iconColor: '#ef4444',
      bgColor: '#ef4444',
      borderColor: '#ef4444',
    },
    warning: {
      icon: 'exclamation-triangle' as const,
      iconColor: '#f59e0b',
      bgColor: '#f59e0b',
      borderColor: '#f59e0b',
    },
    info: {
      icon: 'info-circle' as const,
      iconColor: '#3b82f6',
      bgColor: '#3b82f6',
      borderColor: '#3b82f6',
    },
  };

  const config = typeConfig[type];

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View 
            style={[
              styles.content, 
              { 
                backgroundColor: theme.colors.card,
                borderTopColor: config.borderColor,
                borderColor: theme.colors.border,
              }
            ]}
          >
            {/* Icon */}
            <View 
              style={[
                styles.iconContainer, 
                { 
                  backgroundColor: theme.mode === 'dark' 
                    ? `${config.bgColor}30` 
                    : `${config.bgColor}20`
                }
              ]}
            >
              <FontAwesome name={config.icon} size={48} color={config.iconColor} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>

            {/* Message */}
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {showCancel && (
                <TouchableOpacity
                  style={[
                    styles.button, 
                    { 
                      backgroundColor: theme.colors.backgroundTertiary,
                      borderColor: theme.colors.border,
                    }
                  ]}
                  onPress={handleCancel}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.confirmButton, 
                  { 
                    backgroundColor: config.bgColor,
                    shadowColor: config.bgColor,
                  }
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  content: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    // Estilos aplicados inline com theme
  },
  confirmButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
