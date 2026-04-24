/**
 * Tela para cadastrar um novo atleta (treinador).
 * Cria conta de login para o atleta: nome, email e senha provisória.
 * O atleta fica vinculado ao treinador e pode fazer login com esse email e senha.
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { createAthleteWithLogin } from '@/src/services/athletes.service';
import { assertCanCreateResource } from '@/src/services/planLimits.service';
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
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
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
    const nameTrim = name.trim();
    const emailTrim = email.trim().toLowerCase();

    if (!nameTrim) {
      showAlert('Erro', 'Preencha o nome do atleta.', 'error');
      return;
    }
    if (!emailTrim) {
      showAlert('Erro', 'Preencha o email do atleta (será usado para o login dele).', 'error');
      return;
    }
    if (!temporaryPassword) {
      showAlert('Erro', 'Crie uma senha provisória para o atleta fazer login.', 'error');
      return;
    }
    if (temporaryPassword.length < 6) {
      showAlert('Erro', 'A senha provisória deve ter no mínimo 6 caracteres.', 'error');
      return;
    }
    if (!user?.id) {
      showAlert('Erro', 'Você precisa estar logado.', 'error');
      return;
    }

    setSaving(true);
    try {
      await assertCanCreateResource(user.id, 'athletes');
      await createAthleteWithLogin({
        displayName: nameTrim,
        email: emailTrim,
        temporaryPassword,
        sport: sport.trim() || undefined,
      });
      showAlert(
        'Atleta cadastrado',
        `"${nameTrim}" foi adicionado com sucesso. O atleta pode fazer login no app com:\n\nEmail: ${emailTrim}\nSenha: a que você definiu agora.\n\nRecomende que ele troque a senha após o primeiro acesso.`,
        'success',
        () => router.back()
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível cadastrar o atleta. Tente novamente.';
      showAlert('Erro', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundTertiary,
    color: theme.colors.text,
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
            Cadastre o atleta com email e senha provisória. Ele poderá fazer login no app e ficará vinculado a você.
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              Nome *
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
              placeholder="Ex: Pedro Santos"
              placeholderTextColor={theme.colors.textTertiary}
              value={name}
              onChangeText={setName}
              editable={!saving}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              Email (login do atleta) *
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
              placeholder="Ex: pedro@email.com"
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!saving}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              Senha provisória *
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
              placeholder="Mínimo 6 caracteres (o atleta usará para entrar)"
              placeholderTextColor={theme.colors.textTertiary}
              value={temporaryPassword}
              onChangeText={setTemporaryPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!saving}
            />
            <Text className="text-xs mt-1" style={themeStyles.textTertiary}>
              O atleta fará login com este email e esta senha. Recomende trocar após o primeiro acesso.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={themeStyles.text}>
              Esporte (opcional)
            </Text>
            <TextInput
              className="rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
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
              {saving ? 'Cadastrando...' : 'Cadastrar atleta'}
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
