import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';

type FirstTimeTipProps = {
  storageKey: string;
  title: string;
  description: string;
};

export const FirstTimeTip: React.FC<FirstTimeTipProps> = ({
  storageKey,
  title,
  description,
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkTip = async () => {
      try {
        const seen = await AsyncStorage.getItem(storageKey);
        if (!seen) {
          setVisible(true);
        }
      } catch (error) {
        console.error('Erro ao verificar tutorial da tela:', error);
      }
    };
    checkTip();
  }, [storageKey]);

  const handleClose = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(storageKey, 'true');
    } catch (error) {
      console.error('Erro ao salvar flag de tutorial da tela:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View
        className="flex-1 justify-end px-4 pb-10"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      >
        <View
          className="w-full rounded-2xl p-4"
          style={[
            themeStyles.card,
            {
              borderWidth: 1,
              borderColor: theme.colors.primary + '55',
            },
          ]}
        >
          <Text className="text-base font-semibold mb-1" style={themeStyles.text}>
            {title}
          </Text>
          <Text className="text-xs mb-3 leading-5" style={themeStyles.textSecondary}>
            {description}
          </Text>

          <View className="flex-row justify-end">
            <TouchableOpacity
              onPress={handleClose}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Text className="text-xs font-semibold text-black">Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

