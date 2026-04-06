import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Platform, type ImageSourcePropType, type ImageStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useTheme } from '@/src/contexts/ThemeContext';
import { UserType } from '@/src/types';

/** Base ~44; Home/Treinos/Atletas +15%; Perfil +5%; imagens +21% extra sobre esses valores (10% adicional no ajuste atual). */
const TAB_ICON_BASE = 44;
const TAB_ICON_MAIN = Math.round(TAB_ICON_BASE * 1.15 * 1.41);
const TAB_ICON_PROFILE = Math.round(TAB_ICON_BASE * 1.05 * 1.41 * 0.9);
/** Tamanho base típico do rótulo na tab bar (~10). */
const TAB_LABEL_BASE = 10;
const TAB_LABEL_MAIN = Math.round(TAB_LABEL_BASE * 1.15);
const TAB_LABEL_PROFILE = Math.round(TAB_LABEL_BASE * 1.05);
/** Espaço ícone→texto (marginTop no label): mais negativo = texto mais próximo do ícone. */
const TAB_LABEL_GAP_HOME = -17;
const TAB_LABEL_GAP_MIDDLE = -18;
const TAB_LABEL_GAP_PROFILE = -11;

/**
 * PNGs laranja (ativo) + cinza (inativo).
 * O @react-navigation/bottom-tabs chama este ícone DUAS vezes: uma com focused=true (camada
 * laranja) e outra com focused=false (camada cinza). A opacidade de cada camada é aplicada
 * pelo TabBarIcon conforme a aba está ou não selecionada — não misturar com useNavigationState.
 * Rodapé: usar prop `safeAreaInsets` no Tabs (API do bottom-tabs) para aumentar o inset
 * inferior — a barra cresce sem esmagar o conteúdo. paddingBottom em tabBarItemStyle dentro
 * de altura fixa só comprime e o texto some.
 */
function TabBarPngIcon(props: {
  focused: boolean;
  active: ImageSourcePropType;
  inactive?: ImageSourcePropType;
  /** Largura/altura do PNG (default: +15% sobre base). */
  size?: number;
}) {
  const { focused, active, inactive: inactiveSource, size = TAB_ICON_MAIN } = props;

  const source =
    inactiveSource != null
      ? focused
        ? active
        : inactiveSource
      : active;

  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    ...(inactiveSource != null ? {} : { opacity: focused ? 1 : 0.42 }),
    tintColor: undefined,
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        marginBottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      collapsable={false}>
      <Image
        source={source}
        style={imageStyle}
        resizeMode="contain"
        resizeMethod="resize"
        {...(Platform.OS === 'android' ? { fadeDuration: 0 } : {})}
      />
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [userType, setUserType] = useState<UserType | null>(null);

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

  const secondTabTitle = userType === UserType.ATHLETE ? 'Treinos' : 'Atletas';

  const homeActive = require('../../assets/images/HouseLaranja2.png');
  const homeInactive = require('../../assets/images/HouseCinza2.png');
  const treinoActive = require('../../assets/images/TreinoLaranja2.png');
  const treinoInactive = require('../../assets/images/TreinoCinza2.png');
  const perfilActive = require('../../assets/images/PerfilLaranja2.png');
  const perfilInactive = require('../../assets/images/PerfilCinza2.png');
  const atletasActive = require('../../assets/images/AtletasLaranja2.png');
  const atletasInactive = require('../../assets/images/AtletasCinza2.png');

  return (
    <Tabs
      safeAreaInsets={{
        top: insets.top,
        left: insets.left,
        right: insets.right,
        bottom: insets.bottom + 10,
      }}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarIconStyle: {
          width: TAB_ICON_MAIN,
          height: TAB_ICON_MAIN,
          marginTop: -14,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: TAB_LABEL_MAIN,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          color: theme.colors.text,
          fontWeight: 'bold',
        },
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabelStyle: {
            fontSize: TAB_LABEL_MAIN,
            marginTop: TAB_LABEL_GAP_HOME,
          },
          tabBarIcon: ({ focused }) => (
            <TabBarPngIcon
              focused={focused}
              active={homeActive}
              inactive={homeInactive}
              size={Math.round(TAB_ICON_MAIN * 1.05)}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: secondTabTitle,
          tabBarLabelStyle: {
            fontSize: TAB_LABEL_MAIN,
            marginTop: TAB_LABEL_GAP_MIDDLE,
          },
          tabBarIcon: ({ focused }) =>
            userType === UserType.COACH ? (
              <TabBarPngIcon
                focused={focused}
                active={atletasActive}
                inactive={atletasInactive}
                size={Math.round(TAB_ICON_MAIN * 0.97)}
              />
            ) : (
              <TabBarPngIcon focused={focused} active={treinoActive} inactive={treinoInactive} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIconStyle: {
            width: TAB_ICON_PROFILE,
            height: TAB_ICON_PROFILE,
            marginTop: -8,
            marginBottom: 0,
          },
          tabBarLabelStyle: {
            fontSize: TAB_LABEL_PROFILE,
            marginTop: TAB_LABEL_GAP_PROFILE,
          },
          tabBarIcon: ({ focused }) => (
            <TabBarPngIcon
              focused={focused}
              active={perfilActive}
              inactive={perfilInactive}
              size={TAB_ICON_PROFILE}
            />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
