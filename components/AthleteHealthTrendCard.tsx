/**
 * FC média por treino (últimos com dados) — Dia 18, perfil do atleta (treinador).
 */

import { useTheme } from '@/src/contexts/ThemeContext';
import { listAthleteHealthSnapshots } from '@/src/services/healthFirestore.service';
import { resolveAthleteUserUid } from '@/src/services/healthSync.service';
import { chartDayMonthByLocale } from '@/src/utils/dateOnly';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export function AthleteHealthTrendCard({
  coachId,
  athleteId,
}: {
  coachId: string;
  athleteId: string;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [loading, setLoading] = useState(true);
  const [barData, setBarData] = useState<Array<{ value: number; label: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const athleteUid = await resolveAthleteUserUid(athleteId);
        if (!athleteUid) {
          if (!cancelled) setBarData([]);
          return;
        }

        const snapshots = await listAthleteHealthSnapshots(coachId, athleteUid);
        const withHr = snapshots
          .filter((s) => s.heartRate?.avg != null && s.heartRate!.avg! > 0)
          .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
          .slice(-6);

        const data = withHr.map((s) => ({
          value: s.heartRate!.avg!,
          label: chartDayMonthByLocale(toLocalYmd(s.completedAt), i18n.language),
        }));

        if (!cancelled) setBarData(data);
      } catch {
        if (!cancelled) setBarData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [coachId, athleteId, i18n.language]);

  return (
    <View className="mb-6 rounded-xl p-4 border" style={[themeStyles.card, { borderWidth: 1 }]}>
      <View className="flex-row items-center mb-3">
        <FontAwesome name="heartbeat" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
        <Text className="font-semibold text-base flex-1" style={themeStyles.text}>
          {t('athleteProfile.healthTrendTitle')}
        </Text>
      </View>

      {loading && <ActivityIndicator color={theme.colors.primary} />}

      {!loading && barData.length === 0 && (
        <Text className="text-sm leading-5" style={themeStyles.textSecondary}>
          {t('athleteProfile.healthTrendEmpty')}
        </Text>
      )}

      {!loading && barData.length > 0 && (
        <>
          <BarChart
            data={barData}
            barWidth={28}
            spacing={14}
            roundedTop
            roundedBottom
            frontColor={theme.colors.primary}
            yAxisTextStyle={{ color: theme.colors.textTertiary, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: theme.colors.textTertiary, fontSize: 9 }}
            noOfSections={4}
            maxValue={Math.max(...barData.map((d) => d.value), 120) + 10}
            yAxisLabelSuffix=" bpm"
            height={160}
          />
          <Text className="text-xs mt-2" style={themeStyles.textTertiary}>
            {t('athleteProfile.healthTrendHint')}
          </Text>
        </>
      )}
    </View>
  );
}

function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
