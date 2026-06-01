import { NativeModules } from 'react-native';

import type { HealthKitNativeModule } from './healthKitBridge.types';
import { canUseNativeHealth } from './healthRuntime';

/** Carrega HealthKit: `require` (CJS) — `import()` dinâmico falha em Dev Client iOS. */
export function getAppleHealthKit(): HealthKitNativeModule {
  if (!canUseNativeHealth()) {
    throw new Error('healthkit_module_not_linked');
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fromPackage = require('react-native-health') as HealthKitNativeModule;

  if (typeof fromPackage?.initHealthKit === 'function') {
    return fromPackage;
  }

  const native = NativeModules.AppleHealthKit as HealthKitNativeModule | undefined;
  if (native && typeof native.initHealthKit === 'function') {
    return {
      ...native,
      Constants: fromPackage?.Constants ?? native.Constants,
    };
  }

  throw new Error('healthkit_module_not_linked');
}
