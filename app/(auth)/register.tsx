/**
 * Register Screen
 *
 * Cadastro exclusivo para treinador (conta própria no app).
 * Atletas são criados pelo treinador em "Adicionar atleta".
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { CustomAlert } from '@/components/CustomAlert';
import { TREINA_PRIVACY_URL, TREINA_TERMS_URL } from '@/src/constants/legalUrls';
import { useAuth } from '@/src/hooks/useAuth';
import { UserType } from '@/src/types';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';

const GRADIENT_ORANGE = ['#f97316', '#ea580c'];
const INPUT_BORDER_WIDTH = 1;
const inputBorderColor = (isDark: boolean) =>
  isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.2)';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const isDark = theme.mode === 'dark';
  const fieldBorder = inputBorderColor(isDark);
  const { signUp, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    onConfirm?: () => void
  ) => {
    setAlertState({ visible: true, title, message, type, onConfirm });
  };

  const inputStyle = {
    backgroundColor: theme.colors.background,
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: fieldBorder,
    color: theme.colors.text,
  };

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      showAlert('Erro', 'Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }
    if (!acceptedLegal) {
      showAlert(
        'Atenção',
        'Para criar a conta, marque que leu e aceita os Termos de Uso e a Política de Privacidade.',
        'warning'
      );
      return;
    }

    try {
      await signUp({
        email,
        password,
        displayName,
        userType: UserType.COACH,
        bio: bio.trim() || undefined,
        specialization: specialization.trim() || undefined,
      });
      showAlert(
        'Confirme seu email',
        'Enviamos um email de verificação. Confirme antes de entrar no app.',
        'success',
        () => router.replace('/(auth)/login')
      );
    } catch (err: any) {
      showAlert('Erro ao criar conta', err?.message ?? 'Não foi possível criar a conta.', 'error');
    }
  };

  return (
    <>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={0}
      className="flex-1"
      style={themeStyles.bg}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-14 pb-8 px-6 items-center">
          <Image
            source={require('../../assets/images/treinaLogo2.png')}
            style={{ width: 420, height: 180, marginTop: 50, marginBottom: 90 }}
            resizeMode="contain"
          />
          <Text
            className="text-base text-center max-w-[260px]"
            style={{ color: theme.colors.textSecondary, marginTop: -80 }}
          >
            Gestão de Performance Esportiva
          </Text>
        </View>

        <View className="flex-1 px-5 pb-8">
          <View
            className="rounded-2xl px-5 py-6"
            style={{
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...(theme.mode === 'light'
                ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }
                : {}),
            }}
          >
            <Text className="text-lg font-semibold mb-1" style={themeStyles.text}>
              Criar conta de treinador
            </Text>
            <Text className="text-sm mb-5" style={{ color: theme.colors.textSecondary }}>
              Atletas recebem conta pelo treinador em &quot;Adicionar atleta&quot;.
            </Text>

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Nome completo
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={inputStyle}
              placeholder="Seu nome"
              placeholderTextColor={theme.colors.textTertiary}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Email
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={inputStyle}
              placeholder="seu@email.com"
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Senha
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={inputStyle}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Especialização (opcional)
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={inputStyle}
              placeholder="Ex: Futebol, Atletismo"
              placeholderTextColor={theme.colors.textTertiary}
              value={specialization}
              onChangeText={setSpecialization}
            />

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Biografia (opcional)
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={{ ...inputStyle, minHeight: 80, textAlignVertical: 'top' }}
              placeholder="Um pouco sobre você..."
              placeholderTextColor={theme.colors.textTertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedLegal }}
              onPress={() => setAcceptedLegal((v) => !v)}
              activeOpacity={0.75}
              className="flex-row items-start mb-5"
            >
              <View
                className="mt-0.5 w-6 h-6 rounded-md items-center justify-center border-2"
                style={{
                  borderColor: acceptedLegal ? theme.colors.primary : fieldBorder,
                  backgroundColor: acceptedLegal ? theme.colors.primary : 'transparent',
                }}
              >
                {acceptedLegal ? (
                  <FontAwesome name="check" size={14} color="#ffffff" />
                ) : null}
              </View>
              <Text className="flex-1 ml-3 text-sm leading-5" style={{ color: theme.colors.textSecondary }}>
                Li e aceito os{' '}
                <Text
                  onPress={() => Linking.openURL(TREINA_TERMS_URL)}
                  style={{ color: theme.colors.primary, fontWeight: '600' }}
                  accessibilityRole="link"
                >
                  Termos de Uso
                </Text>
                {' e a '}
                <Text
                  onPress={() => Linking.openURL(TREINA_PRIVACY_URL)}
                  style={{ color: theme.colors.primary, fontWeight: '600' }}
                  accessibilityRole="link"
                >
                  Política de Privacidade
                </Text>
                .
              </Text>
            </TouchableOpacity>

            {error ? (
              <View className="mb-4 rounded-lg py-2.5 px-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
                <Text className="text-sm text-center" style={{ color: theme.colors.error }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading || !acceptedLegal}
              activeOpacity={0.85}
              style={{ overflow: 'hidden', borderRadius: 14, opacity: !acceptedLegal && !loading ? 0.55 : 1 }}
            >
              <LinearGradient
                colors={GRADIENT_ORANGE}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-base font-semibold" style={{ color: '#ffffff' }}>
                    Criar conta
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              className="mt-6 py-2"
              activeOpacity={0.7}
            >
              <Text className="text-center text-sm" style={{ color: theme.colors.primary }}>
                Já tem uma conta? <Text className="font-semibold">Faça login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    <CustomAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      onConfirm={() => {
        const onConfirm = alertState.onConfirm;
        setAlertState((prev) => ({ ...prev, visible: false, onConfirm: undefined }));
        onConfirm?.();
      }}
    />
    </>
  );
}
