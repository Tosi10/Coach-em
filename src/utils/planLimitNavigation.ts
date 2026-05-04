import { Alert } from 'react-native';

import { FreePlanLimitError } from '@/src/services/planLimits.service';

type RouterPush = { push: (href: '/subscription') => void };

/** Chamado nos `catch` de fluxos de criação; devolve true se já mostrou UI do limite. */
export function alertPlanLimitAndOfferSubscription(
  router: RouterPush,
  error: unknown
): error is FreePlanLimitError {
  if (error instanceof FreePlanLimitError) {
    Alert.alert('Limite do plano', error.message, [
      { text: 'Fechar', style: 'cancel' },
      { text: 'Ver planos', onPress: () => router.push('/subscription') },
    ]);
    return true;
  }
  return false;
}
