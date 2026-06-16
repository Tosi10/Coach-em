import { useEffect, useState } from 'react';

import { useAuthContext } from '@/src/contexts/AuthContext';
import type { User } from '@/src/types';
import { canUseHealthForAthlete } from '@/src/utils/athleteCapabilities';

export function useCanUseHealthForAthlete(userOverride?: User | null) {
  const { user: authUser } = useAuthContext();
  const user = userOverride ?? authUser;
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const ok = await canUseHealthForAthlete(user);
        if (!cancelled) setAllowed(ok);
      } catch {
        if (!cancelled) setAllowed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    user?.userType,
    user?.athleteMode,
    user?.coachId,
    (user as { subscriptionTier?: string } | null | undefined)?.subscriptionTier,
  ]);

  return { allowed, loading };
}
