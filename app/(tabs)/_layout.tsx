import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { UserType } from '@/src/types';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useTheme();
  const [userType, setUserType] = useState<UserType | null>(null);

  // Carregar tipo de usuário do AsyncStorage
  useEffect(() => {
    const loadUserType = async () => {
      try {
        const storedUserType = await AsyncStorage.getItem('userType');
        if (storedUserType) {
          setUserType(storedUserType as UserType);
        }
      } catch (error) {
        console.error('Erro ao carregar tipo de usuário:', error);
      }
    };
    loadUserType();
  }, []);

  // Determinar título e ícone da segunda aba baseado no tipo de usuário
  const secondTabTitle = userType === UserType.ATHLETE ? 'Treinos' : 'Atletas';
  // Usando 'heartbeat' para treinos (batimento cardíaco/fitness) - ícone disponível no FontAwesome padrão
  // Alternativas disponíveis: 'fire' (intensidade), 'trophy' (troféu), 'calendar' (agenda)
  const secondTabIcon = userType === UserType.ATHLETE ? 'heartbeat' : 'users';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary, // Orange for active tab
        tabBarInactiveTintColor: theme.colors.textTertiary, // Gray for inactive tabs
        tabBarStyle: {
          backgroundColor: theme.colors.card, // Card background
          borderTopColor: theme.colors.border, // Border color
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: theme.colors.background, // Background color
        },
        headerTintColor: theme.colors.text, // Text/icon color
        headerTitleStyle: {
          color: theme.colors.text, // Title color
          fontWeight: 'bold',
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: secondTabTitle,
          tabBarIcon: ({ color }) => <TabBarIcon name={secondTabIcon as any} color={color} />,
        }}
      />
    </Tabs>
  );
}
