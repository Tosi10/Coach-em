import type { HealthKitNativeModule } from './healthKitBridge.types';

/** Stub — implementação real em `healthKitBridge.ios.ts`. */
export function getAppleHealthKit(): HealthKitNativeModule {
  throw new Error('healthkit_only_ios');
}
