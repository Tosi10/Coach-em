export type HealthKitNativeModule = {
  initHealthKit: (permissions: unknown, callback: (error: string | null) => void) => void;
  Constants: { Permissions: Record<string, string> };
  getHeartRateSamples: (
    options: { startDate: string; endDate: string },
    callback: (err: string, results: any) => void,
  ) => void;
  getActiveEnergyBurned: (
    options: { startDate: string; endDate: string },
    callback: (err: string, results: any) => void,
  ) => void;
  getDistanceWalkingRunning: (
    options: { startDate: string; endDate: string },
    callback: (err: string, results: any) => void,
  ) => void;
  getStepCount: (
    options: { startDate: string; endDate: string },
    callback: (err: string, results: any) => void,
  ) => void;
  getAnchoredWorkouts: (
    options: { startDate: string; endDate: string },
    callback: (err: any, results: { data?: unknown[] }) => void,
  ) => void;
};
