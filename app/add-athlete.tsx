/**
 * Tela para cadastrar um novo atleta (treinador).
 * Salva em Firestore (coachemAthletes).
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { createAthlete } from '@/src/services/athletes.service';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddAthleteScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);

  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [saving, setSaving] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>();

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    onConfirm?: () => void
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOnConfirm(onConfirm ? () => setTimeout(onConfirm, 0) : undefined);
    setAlertVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Erro', 'Preencha o nome do atleta.', 'error');
      return;
    }
    const coachId = user?.id;
    if (!coachId) {
      showAlert('Erro', 'Você precisa estar logado.', 'error');
      return;
    }
    setSaving(true);
    try {
      await createAthlete(coachId, {
        name: name.trim(),
        sport: sport.trim() || undefined,
      });
      showAlert(
        'Atleta cadastrado',
        `"${name.trim()}" foi adicionado. Agora você pode atribuir treinos a ele na aba Atletas ou em Meus Treinos.`,
        'success',
        () => router.back()
      );
    } catch (e) {
      console.error('Erro ao cadastrar atleta:', e);
      showAlert('Erro', 'Não foi possível cadastrar o atleta. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView className="flex-1" style={themeStyles.bg}>
        <View className="px-6 pt-20 pb-20">
          <TouchableOpacity
            className="mb-6 flex-row items-center"
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View
              className="rounded-full w-10 h-10 items-center justify-center mr-3 border"
              style={themeStyles.cardSecondary}
            >
              <FontAwesome name="arrow-left" size={18} color={theme.colors.primary} />
            </View>
            <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>
              Voltar
            </Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold mb-2" style={themeStyles.text}>
            Novo atleta
          </Text>
          <Text className="mb-6" style={themeStyles.textSecondary}>
            Cadastre o atleta para poder atribuir treinos a ele.
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              Nome *
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={{
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.backgroundTertiary,
                color: theme.colors.text,
              }}
              placeholder="Ex: Pedro Santos"
              placeholderTextColor={theme.colors.textTertiary}
              value={name}
              onChangeText={setName}
              editable={!saving}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              Esporte (opcional)
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={{
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.backgroundTertiary,
                color: theme.colors.text,
              }}
              placeholder="Ex: Futebol, Corrida"
              placeholderTextColor={theme.colors.textTertiary}
              value={sport}
              onChangeText={setSport}
              editable={!saving}
            />
          </View>

          <TouchableOpacity
            className="rounded-xl py-4 items-center"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleSave}
            disabled={saving}
          >
            <Text className="font-bold text-base" style={{ color: '#fff' }}>
              {saving ? 'Salvando...' : 'Cadastrar atleta'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onConfirm={() => {
          if (alertOnConfirm) alertOnConfirm();
          setAlertVisible(false);
        }}
      />
    </>
  );
}
