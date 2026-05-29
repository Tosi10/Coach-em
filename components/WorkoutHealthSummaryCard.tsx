/**
 * Resumo de saúde de um treino (coach + atleta) — Sprint 4 / Dias 16–17.
 */

import { useTheme } from '@/src/contexts/ThemeContext';
import { getHealthSnapshot } from '@/src/services/healthFirestore.service';
import type { HealthSnapshot, HRZones } from '@/src/types/health';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

type LoadState = 'loading' | 'empty' | 'ready' | 'error';

const ZONE_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#ef4444'] as const;

function formatDistance(meters: number | null, locale: string): string | null {
  if (meters == null || meters <= 0) return null;
  if (meters >= 1000) {
    return `${(meters / 1000).toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', {
      maximumFractionDigits: 2,
    })} km`;
  }
  return `${Math.round(meters)} m`;
}

function ZoneBars({ zones, labels }: { zones: HRZones; labels: string[] }) {
  const total = zones.z1 + zones.z2 + zones.z3 + zones.z4 + zones.z5;
  if (total <= 0) return null;

  const values = [zones.z1, zones.z2, zones.z3, zones.z4, zones.z5];

  return (
    <View className="mt-3">
      {values.map((value, index) => {
        if (value <= 0) return null;
        const pct = Math.round((value / total) * 100);
        return (
          <View key={labels[index]} className="mb-2">
            <View className="flex-row justify-between mb-1">
              <Text className="text-xs" style={{ color: ZONE_COLORS[index] }}>
                {labels[index]}
              </Text>
              <Text className="text-xs opacity-70" style={{ color: '#a3a3a3' }}>
                {pct}%
              </Text>
            </View>
            <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#262626' }}>
              <View
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: ZONE_COLORS[index],
                  borderRadius: 999,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function WorkoutHealthSummaryCard({
  workoutId,
  athleteId,
}: {
  workoutId: string;
  athleteId: string;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [state, setState] = useState<LoadState>('loading');
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState('loading');
      try {
        if (!athleteId?.trim()) {
          if (!cancelled) setState('empty');
          return;
        }

        const data = await getHealthSnapshot(workoutId, athleteId.trim());
        if (cancelled) return;

        if (!data) {
          setSnapshot(null);
          setState('empty');
          return;
        }

        const hasMetric =
          data.heartRate != null ||
          data.caloriesActive != null ||
          data.distanceMeters != null ||
          data.steps != null ||
          data.workoutSessions.length > 0;

        setSnapshot(data);
        setState(hasMetric ? 'ready' : 'empty');
      } catch {
        if (!cancelled) setState('error');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [workoutId, athleteId]);

  const zoneLabels = [
    t('workoutDetails.healthZoneZ1'),
    t('workoutDetails.healthZoneZ2'),
    t('workoutDetails.healthZoneZ3'),
    t('workoutDetails.healthZoneZ4'),
    t('workoutDetails.healthZoneZ5'),
  ];

  return (
    <View className="mt-4 rounded-xl p-4 border" style={[themeStyles.card, { borderWidth: 1 }]}>
      <View className="flex-row items-center mb-3">
        <FontAwesome name="heartbeat" size={18} color={theme.colors.primary} style={{ marginRight: 10 }} />
        <Text className="font-semibold text-base flex-1" style={themeStyles.text}>
          {t('workoutDetails.healthCardTitle')}
        </Text>
      </View>

      {state === 'loading' && (
        <ActivityIndicator color={theme.colors.primary} />
      )}

      {state === 'error' && (
        <Text className="text-sm leading-5" style={themeStyles.textSecondary}>
          {t('workoutDetails.healthCardError')}
        </Text>
      )}

      {state === 'empty' && (
        <Text className="text-sm leading-5" style={themeStyles.textSecondary}>
          {t('workoutDetails.healthCardEmpty')}
        </Text>
      )}

      {state === 'ready' && snapshot && (
        <>
          {(snapshot.startedAt || snapshot.completedAt) && (
            <Text className="text-xs mb-3" style={themeStyles.textTertiary}>
              {t('workoutDetails.healthCardWindow', {
                start: snapshot.startedAt.toLocaleTimeString(
                  i18n.language === 'en' ? 'en-US' : 'pt-BR',
                  { hour: '2-digit', minute: '2-digit' },
                ),
                end: snapshot.completedAt.toLocaleTimeString(
                  i18n.language === 'en' ? 'en-US' : 'pt-BR',
                  { hour: '2-digit', minute: '2-digit' },
                ),
              })}
            </Text>
          )}

          <View className="flex-row flex-wrap gap-3 mb-2">
            {snapshot.heartRate?.avg != null && (
              <MetricPill
                label={t('workoutDetails.healthHrAvg')}
                value={`${snapshot.heartRate.avg} bpm`}
                themeStyles={themeStyles}
              />
            )}
            {snapshot.heartRate?.max != null && (
              <MetricPill
                label={t('workoutDetails.healthHrMax')}
                value={`${snapshot.heartRate.max} bpm`}
                themeStyles={themeStyles}
              />
            )}
            {snapshot.heartRate?.min != null && (
              <MetricPill
                label={t('workoutDetails.healthHrMin')}
                value={`${snapshot.heartRate.min} bpm`}
                themeStyles={themeStyles}
              />
            )}
            {snapshot.caloriesActive != null && (
              <MetricPill
                label={t('workoutDetails.healthCalories')}
                value={`${Math.round(snapshot.caloriesActive)} kcal`}
                themeStyles={themeStyles}
              />
            )}
            {formatDistance(snapshot.distanceMeters, i18n.language) && (
              <MetricPill
                label={t('workoutDetails.healthDistance')}
                value={formatDistance(snapshot.distanceMeters, i18n.language)!}
                themeStyles={themeStyles}
              />
            )}
            {snapshot.steps != null && snapshot.steps > 0 && (
              <MetricPill
                label={t('workoutDetails.healthSteps')}
                value={String(snapshot.steps)}
                themeStyles={themeStyles}
              />
            )}
          </View>

          {snapshot.heartRate?.zones && (
            <>
              <Text className="text-sm font-medium mt-2 mb-1" style={themeStyles.textSecondary}>
                {t('workoutDetails.healthZonesTitle')}
              </Text>
              <ZoneBars zones={snapshot.heartRate.zones} labels={zoneLabels} />
            </>
          )}

          {snapshot.workoutSessions.length > 0 && (
            <Text className="text-xs mt-3" style={themeStyles.textTertiary}>
              {t('workoutDetails.healthSessions', { count: snapshot.workoutSessions.length })}
            </Text>
          )}

          {snapshot.device && (
            <Text className="text-xs mt-2" style={themeStyles.textTertiary}>
              {t('workoutDetails.healthSource', { device: snapshot.device })}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

function MetricPill({
  label,
  value,
  themeStyles,
}: {
  label: string;
  value: string;
  themeStyles: ReturnType<typeof getThemeStyles>;
}) {
  return (
    <View
      className="rounded-lg px-3 py-2 min-w-[44%] flex-grow"
      style={[themeStyles.bgTertiary, { borderWidth: 1, borderColor: '#333' }]}
    >
      <Text className="text-xs mb-0.5" style={themeStyles.textTertiary}>
        {label}
      </Text>
      <Text className="font-semibold text-sm" style={themeStyles.text}>
        {value}
      </Text>
    </View>
  );
}
