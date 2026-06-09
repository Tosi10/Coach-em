import { useAuthContext } from '@/src/contexts/AuthContext';
import { UserType } from '@/src/types';
import { canManageOwnTraining } from '@/src/utils/athleteCapabilities';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Redireciona atletas coached free que tentam abrir biblioteca / criar treinos próprios.
 * Solo e coached + Athlete Pro passam.
 */
export function useOwnTrainingGuard(redirectTo: '/(tabs)/two' = '/(tabs)/two') {
  const { user } = useAuthContext();
  const router = useRouter();
  const blocked =
    user?.userType === UserType.ATHLETE && user.id != null && !canManageOwnTraining(user);

  useEffect(() => {
    if (blocked) {
      router.replace(redirectTo);
    }
  }, [blocked, redirectTo, router]);

  return { blocked, user };
}
