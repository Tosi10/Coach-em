import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';

import { ATHLETE_LEGAL_ACCEPTANCE_KEY } from '@/src/constants/legalUrls';
import type { User } from '@/src/types';
import { UserType } from '@/src/types';

/**
 * Após autenticação bem-sucedida: grava tipo/atleta e envia para aceite legal (atleta) ou tabs.
 * Usado pelo gate `app/index.tsx` e por `app/(auth)/login.tsx` (o login não passava pelo index).
 */
export async function persistSessionAndNavigateHome(
  replace: (href: Href) => void,
  user: User
): Promise<void> {
  await AsyncStorage.setItem('userType', user.userType);
  if (user.userType === UserType.ATHLETE) {
    await AsyncStorage.setItem('currentAthleteId', user.id);
    const legalOk = await AsyncStorage.getItem(ATHLETE_LEGAL_ACCEPTANCE_KEY);
    if (legalOk !== 'true') {
      replace('/athlete-legal-acceptance');
      return;
    }
  }
  replace('/(tabs)');
}
