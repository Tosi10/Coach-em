import * as Sentry from '@sentry/react-native';

const raw = process.env.EXPO_PUBLIC_SENTRY_DSN;
const dsn = typeof raw === 'string' ? raw.trim() : '';
const enabled = dsn.length > 8;

/** Sempre inicializar antes de `Sentry.wrap` (senão o profiler avisa e o App Start span falha). */
Sentry.init({
  dsn: enabled ? dsn : undefined,
  enabled,
  sendDefaultPii: false,
  debug: __DEV__ && enabled,
  tracesSampleRate: enabled && !__DEV__ ? 0.2 : 0,
  enableAutoSessionTracking: enabled,
});

export { Sentry };
