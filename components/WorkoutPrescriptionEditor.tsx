import { useTheme } from '@/src/contexts/ThemeContext';
import type { WorkoutExercise } from '@/src/types';
import { formatDuration, minutesSecondsToSeconds, splitSeconds } from '@/src/utils/timeFormat';
import {
  getPrescriptionTypeLabel,
  getProtocolTotalDuration,
  inferPrescriptionType,
  type IntervalPhase,
} from '@/src/utils/workoutPrescription';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

type WorkoutPrescriptionEditorProps = {
  value: WorkoutExercise;
  onChange: (updates: Partial<WorkoutExercise>) => void;
};

const TYPES: NonNullable<WorkoutExercise['prescriptionType']>[] = ['strength', 'interval', 'free'];

function toNumber(text: string): number | undefined {
  return text.trim() ? Number.parseInt(text, 10) || undefined : undefined;
}

function inputStyle(theme: ReturnType<typeof useTheme>['theme']) {
  return {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  };
}

export function WorkoutPrescriptionEditor({ value, onChange }: WorkoutPrescriptionEditorProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const type = inferPrescriptionType(value);
  const duration = splitSeconds(value.duration);
  const roundRestSplit = splitSeconds(value.roundRest);
  const roundsNumber = toNumber(value.rounds?.toString() || '') || 0;

  const setType = (nextType: NonNullable<WorkoutExercise['prescriptionType']>) => {
    const base: Partial<WorkoutExercise> = { prescriptionType: nextType };
    if (nextType === 'strength') {
      onChange({ ...base, intervalProtocol: undefined, protocolName: undefined });
      return;
    }
    if (nextType === 'interval') {
      onChange({ ...base, sets: undefined, reps: undefined, rounds: value.rounds, roundRest: value.roundRest });
      return;
    }
    onChange({ ...base });
  };

  const updatePhase = (index: number, patch: Partial<IntervalPhase>) => {
    const protocol = [...(value.intervalProtocol || [])];
    protocol[index] = { ...protocol[index], ...patch };
    const total = getProtocolTotalDuration(protocol, value.rounds || 1, { roundRest: value.roundRest });
    onChange({ intervalProtocol: protocol, duration: total || undefined });
  };

  const removePhase = (index: number) => {
    const protocol = (value.intervalProtocol || []).filter((_, i) => i !== index);
    onChange({
      intervalProtocol: protocol,
      duration: getProtocolTotalDuration(protocol, value.rounds || 1, { roundRest: value.roundRest }) || undefined,
    });
  };

  const addPhase = () => {
    const protocol = [
      ...(value.intervalProtocol || []),
      {
        id: `phase_${Date.now()}`,
        name: '',
        duration: 30,
        intensity: 'moderate' as const,
      },
    ];
    onChange({
      intervalProtocol: protocol,
      duration: getProtocolTotalDuration(protocol, value.rounds || 1, { roundRest: value.roundRest }),
    });
  };

  const setRounds = (roundsText: string) => {
    const rounds = toNumber(roundsText);
    const keepRoundRest = (rounds || 0) > 1 ? value.roundRest : undefined;
    onChange({
      rounds,
      roundRest: keepRoundRest,
      duration: getProtocolTotalDuration(value.intervalProtocol, rounds || 1, { roundRest: keepRoundRest }) || value.duration,
    });
  };

  return (
    <View className="mt-2">
      <Text className="text-xs mb-2 font-semibold" style={themeStyles.textSecondary}>
        {t('prescription.exerciseType')}
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {TYPES.map((item) => (
          <TouchableOpacity
            key={item}
            className="rounded-lg px-3 py-2 border"
            style={{
              backgroundColor: type === item ? theme.colors.primary : theme.colors.backgroundTertiary,
              borderColor: type === item ? theme.colors.primary : theme.colors.border,
            }}
            onPress={() => setType(item)}
          >
            <Text className="text-xs font-semibold" style={{ color: type === item ? '#ffffff' : theme.colors.text }}>
              {getPrescriptionTypeLabel(t, item)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'strength' && (
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs mb-1" style={themeStyles.textSecondary}>{t('prescription.sets')}</Text>
            <TextInput
              className="border rounded px-3 py-2"
              style={{ ...inputStyle(theme), fontSize: 18, fontWeight: '700', textAlign: 'center' }}
              placeholder={t('prescription.exampleSets')}
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={value.sets?.toString() || ''}
              onChangeText={(text) => onChange({ sets: toNumber(text) })}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs mb-1" style={themeStyles.textSecondary}>{t('prescription.reps')}</Text>
            <TextInput
              className="border rounded px-3 py-2"
              style={{ ...inputStyle(theme), fontSize: 18, fontWeight: '700', textAlign: 'center' }}
              placeholder={t('prescription.exampleReps')}
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={value.reps?.toString() || ''}
              onChangeText={(text) => onChange({ reps: toNumber(text) })}
            />
          </View>
        </View>
      )}

      {type === 'free' && (
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs mb-1" style={themeStyles.textSecondary}>{t('prescription.minutes')}</Text>
            <TextInput
              className="border rounded px-3 py-2"
              style={inputStyle(theme)}
              placeholder={t('prescription.exampleMinutes')}
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={duration.minutes}
              onChangeText={(text) => onChange({ duration: minutesSecondsToSeconds(text, duration.seconds) })}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs mb-1" style={themeStyles.textSecondary}>{t('prescription.seconds')}</Text>
            <TextInput
              className="border rounded px-3 py-2"
              style={inputStyle(theme)}
              placeholder={t('prescription.exampleSeconds')}
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={duration.seconds}
              onChangeText={(text) => onChange({ duration: minutesSecondsToSeconds(duration.minutes, text) })}
            />
          </View>
        </View>
      )}

      {type === 'interval' && (
        <View className="rounded-xl p-3 mb-3 border" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundTertiary }}>
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs mb-1" style={themeStyles.textSecondary}>{t('prescription.protocolName')}</Text>
              <TextInput
                className="border rounded px-3 py-2"
                style={inputStyle(theme)}
                placeholder={t('prescription.protocolNamePlaceholder')}
                placeholderTextColor={theme.colors.textTertiary}
                value={value.protocolName || ''}
                onChangeText={(text) => onChange({ protocolName: text })}
              />
            </View>
            <View style={{ width: 82 }}>
              <Text className="text-xs mb-1" style={themeStyles.textSecondary}>{t('prescription.rounds')}</Text>
              <TextInput
                className="border rounded px-3 py-2"
                style={inputStyle(theme)}
                placeholder="1"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={value.rounds?.toString() || ''}
                onChangeText={setRounds}
              />
            </View>
          </View>

          {(value.intervalProtocol || []).map((phase, index) => (
            <View key={phase.id || index} className="mb-3">
              <View className="flex-row gap-2">
                <TextInput
                  className="border rounded px-3 py-2 flex-1"
                  style={inputStyle(theme)}
                  placeholder={t('prescription.phaseNamePlaceholder')}
                  placeholderTextColor={theme.colors.textTertiary}
                  value={phase.name}
                  onChangeText={(text) => updatePhase(index, { name: text })}
                />
                <TextInput
                  className="border rounded px-3 py-2"
                  style={{ ...inputStyle(theme), width: 66, textAlign: 'center' }}
                  placeholder={t('prescription.minShort')}
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="numeric"
                  value={splitSeconds(phase.duration).minutes}
                  onChangeText={(text) =>
                    updatePhase(index, {
                      duration: minutesSecondsToSeconds(text, splitSeconds(phase.duration).seconds) || 0,
                    })
                  }
                />
                <TextInput
                  className="border rounded px-3 py-2"
                  style={{ ...inputStyle(theme), width: 66, textAlign: 'center' }}
                  placeholder={t('prescription.secShort')}
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="numeric"
                  value={splitSeconds(phase.duration).seconds}
                  onChangeText={(text) =>
                    updatePhase(index, {
                      duration: minutesSecondsToSeconds(splitSeconds(phase.duration).minutes, text) || 0,
                    })
                  }
                />
                <TouchableOpacity
                  className="rounded px-3 justify-center"
                  style={{ backgroundColor: '#ef444433' }}
                  onPress={() => removePhase(index)}
                >
                  <Text style={{ color: '#ef4444', fontWeight: '700' }}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            className="rounded-lg px-3 py-2 border"
            style={{
              backgroundColor: theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.18)' : 'rgba(251, 146, 60, 0.12)',
              borderColor: theme.colors.primary + '80',
            }}
            onPress={addPhase}
          >
            <Text className="text-center font-semibold" style={{ color: theme.colors.primary }}>
              {t('prescription.addPhase')}
            </Text>
          </TouchableOpacity>

          <View className="mt-3">
            <TouchableOpacity
              className="rounded-lg px-3 py-2 border"
              style={{
                backgroundColor: roundsNumber > 1
                  ? (theme.mode === 'dark' ? 'rgba(251, 146, 60, 0.18)' : 'rgba(251, 146, 60, 0.12)')
                  : theme.colors.backgroundTertiary,
                borderColor: roundsNumber > 1 ? theme.colors.primary + '80' : theme.colors.border + '66',
                opacity: roundsNumber > 1 ? 1 : 0.45,
              }}
              disabled={roundsNumber <= 1}
              onPress={() => {
                const nextRoundRest = value.roundRest ? undefined : 30;
                onChange({
                  roundRest: nextRoundRest,
                  duration: getProtocolTotalDuration(value.intervalProtocol, value.rounds || 1, { roundRest: nextRoundRest }) || undefined,
                });
              }}
            >
              <Text className="text-center font-semibold" style={{ color: theme.colors.primary }}>
                {value.roundRest ? t('prescription.removeRoundRest') : t('prescription.addRoundRest')}
              </Text>
            </TouchableOpacity>
          </View>

          {value.roundRest !== undefined && roundsNumber > 1 ? (
            <View className="flex-row gap-2 mt-2">
              <TextInput
                className="border rounded px-3 py-2 flex-1"
                style={inputStyle(theme)}
                placeholder={t('prescription.restBetweenRoundsMin')}
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={roundRestSplit.minutes}
                onChangeText={(text) => {
                  const next = minutesSecondsToSeconds(text, roundRestSplit.seconds);
                  onChange({
                    roundRest: next,
                    duration: getProtocolTotalDuration(value.intervalProtocol, value.rounds || 1, { roundRest: next }) || undefined,
                  });
                }}
              />
              <TextInput
                className="border rounded px-3 py-2 flex-1"
                style={inputStyle(theme)}
                placeholder={t('prescription.restBetweenRoundsSec')}
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={roundRestSplit.seconds}
                onChangeText={(text) => {
                  const next = minutesSecondsToSeconds(roundRestSplit.minutes, text);
                  onChange({
                    roundRest: next,
                    duration: getProtocolTotalDuration(value.intervalProtocol, value.rounds || 1, { roundRest: next }) || undefined,
                  });
                }}
              />
            </View>
          ) : null}

          <Text className="text-xs mt-3 text-center" style={themeStyles.textSecondary}>
            {t('prescription.totalTime', {
              time: formatDuration(getProtocolTotalDuration(value.intervalProtocol, value.rounds || 1, { roundRest: value.roundRest })),
            })}
          </Text>
        </View>
      )}

      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>{t('prescription.restMin')}</Text>
          <TextInput
            className="border rounded px-3 py-2"
            style={inputStyle(theme)}
            placeholder={t('prescription.exampleRestMin')}
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="numeric"
            value={splitSeconds(value.restTime).minutes}
            onChangeText={(text) =>
              onChange({ restTime: minutesSecondsToSeconds(text, splitSeconds(value.restTime).seconds) })
            }
          />
        </View>
        <View className="flex-1">
          <Text className="text-xs mb-1" style={themeStyles.textSecondary}>{t('prescription.restSec')}</Text>
          <TextInput
            className="border rounded px-3 py-2"
            style={inputStyle(theme)}
            placeholder={t('prescription.exampleRestSec')}
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="numeric"
            value={splitSeconds(value.restTime).seconds}
            onChangeText={(text) =>
              onChange({ restTime: minutesSecondsToSeconds(splitSeconds(value.restTime).minutes, text) })
            }
          />
        </View>
      </View>

      <View className="mb-2">
        <Text className="text-xs mb-1" style={themeStyles.textSecondary}>{t('prescription.notes')}</Text>
        <TextInput
          className="border rounded px-3 py-2"
          style={inputStyle(theme)}
          placeholder={t('prescription.notesPlaceholder')}
          placeholderTextColor={theme.colors.textTertiary}
          value={value.notes || ''}
          onChangeText={(text) => onChange({ notes: text })}
          multiline
          numberOfLines={2}
        />
      </View>
    </View>
  );
}
