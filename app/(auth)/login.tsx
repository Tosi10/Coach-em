/**
 * Login Screen
 *
 * Tela de login do Treina+ – design com logo, card e gradiente.
 */

import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { EmailNotVerifiedError, resendVerificationEmail, sendPasswordResetEmailTo } from '@/src/services/auth.service';
import { persistSessionAndNavigateHome } from '@/src/utils/navigateAfterAuth';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { BetaBadge } from '@/components/BetaBadge';
import { CustomAlert } from '@/components/CustomAlert';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const GRADIENT_ORANGE: readonly [string, string] = ['#f97316', '#ea580c'];
/** 1px real (1.5 costuma arredondar para 2 no Android). Contraste um pouco maior para compensar. */
const INPUT_BORDER_WIDTH = 1;
const inputBorderColor = (isDark: boolean) =>
  isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.2)';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const isDark = theme.mode === 'dark';
  const fieldBorder = inputBorderColor(isDark);
  const { signIn, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [resendVerificationSending, setResendVerificationSending] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    setAlertState({ visible: true, title, message, type });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Erro', 'Por favor, preencha todos os campos.', 'warning');
      return;
    }

    try {
      setShowResendVerification(false);
      const user = await signIn({ email, password });
      await persistSessionAndNavigateHome(router.replace, user);
    } catch (err: any) {
      const msg = err?.message ?? 'Erro ao fazer login';
      if (msg.toLowerCase().includes('conta de atleta foi bloqueada')) {
        router.replace('/(auth)/blocked');
        return;
      }
      if (err instanceof EmailNotVerifiedError || msg.toLowerCase().includes('email') && msg.toLowerCase().includes('confirm')) {
        setShowResendVerification(true);
      }
      showAlert('Erro ao fazer login', msg, 'error');
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) {
      showAlert('Confirmação de email', 'Digite email e senha para reenviar a confirmação.', 'info');
      return;
    }
    try {
      setResendVerificationSending(true);
      await resendVerificationEmail(email, password);
      showAlert(
        'Email reenviado',
        'Enviamos novamente o email de confirmação. Verifique caixa de entrada e spam.',
        'success'
      );
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível reenviar o email de confirmação.', 'error');
    } finally {
      setResendVerificationSending(false);
    }
  };

  const handleForgotPassword = async () => {
    const e = email.trim().toLowerCase();
    if (!e) {
      showAlert(
        'Email',
        'Digite seu email no campo acima para receber o link de recuperação.',
        'info'
      );
      return;
    }
    try {
      setResetSending(true);
      await sendPasswordResetEmailTo(e);
      showAlert(
        'Email enviado',
        'Se existir uma conta com este endereço, você receberá um link para redefinir a senha. Verifique também a pasta de spam.',
        'success'
      );
    } catch (err: any) {
      showAlert('Erro', err?.message ?? 'Não foi possível enviar o email.', 'error');
    } finally {
      setResetSending(false);
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <View className="pt-14 pb-8 px-6 items-center">
          <Image
            source={require('../../assets/images/treinaLogo2.png')}
            style={{ width: 420, height: 180, marginTop: 50, marginBottom: 90 }}
            resizeMode="contain"
          />
          <Text className="text-base text-center max-w-[260px]" style={{ color: theme.colors.textSecondary, marginTop: -80 }}>
            Gestão de Performance Esportiva
          </Text>
          <View className="mt-3">
            <BetaBadge subtitle="" />
          </View>
        </View>

        {/* Form card */}
        <View className="flex-1 px-5 pb-8">
          <View
            className="rounded-2xl px-5 py-6"
            style={{
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              ...(theme.mode === 'light' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 } : {}),
            }}
          >
            <Text className="text-lg font-semibold mb-5" style={themeStyles.text}>
              Entrar na sua conta
            </Text>

            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
              Email
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3.5 mb-4 text-base"
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: INPUT_BORDER_WIDTH,
                borderColor: fieldBorder,
                color: theme.colors.text,
                height: 56,
                paddingVertical: 0,
                textAlignVertical: 'center',
              }}
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
            <View className="mb-2" style={{ position: 'relative' }}>
              <TextInput
                className="w-full rounded-xl px-4 py-3.5 pr-10 text-base"
                style={{
                  backgroundColor: theme.colors.background,
                  borderWidth: INPUT_BORDER_WIDTH,
                  borderColor: fieldBorder,
                  color: theme.colors.text,
                  height: 56,
                  paddingVertical: 0,
                  textAlignVertical: 'center',
                }}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.7}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  marginTop: -10,
                }}
              >
                <FontAwesome
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View className="mb-4 flex-row justify-end">
              <TouchableOpacity onPress={handleForgotPassword} disabled={resetSending || loading} activeOpacity={0.7}>
                <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                  {resetSending ? 'Enviando…' : 'Esqueci minha senha'}
                </Text>
              </TouchableOpacity>
            </View>

            {showResendVerification && (
              <View className="mb-4">
                <TouchableOpacity
                  onPress={handleResendVerification}
                  disabled={resendVerificationSending || loading}
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                    {resendVerificationSending ? 'Reenviando confirmação…' : 'Reenviar email de confirmação'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {error ? (
              <View className="mb-4 rounded-lg py-3 px-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
                <Text className="text-xs font-medium mb-1" style={{ color: theme.colors.error }}>
                  Erro ao conectar
                </Text>
                <Text className="text-sm" style={{ color: theme.colors.error }}>
                  {error}
                </Text>
                <Text className="text-xs mt-2" style={{ color: theme.colors.textTertiary }}>
                  Confira o .env (EXPO_PUBLIC_FIREBASE_*) e se o projeto está ativo no Firebase Console.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={{ overflow: 'hidden', borderRadius: 14 }}
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
                    Entrar
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              disabled={loading}
              className="mt-6 py-2"
              activeOpacity={0.7}
            >
              <Text className="text-center text-sm" style={{ color: theme.colors.primary }}>
                Não tem uma conta? <Text className="font-semibold">Registre-se</Text>
              </Text>
            </TouchableOpacity>

            <Text className="text-center text-[11px] mt-3" style={themeStyles.textTertiary}>
              Desenvolvido por <Text style={{ color: theme.colors.primary }}>Vision10</Text>
            </Text>
            <Text className="text-center text-[11px] mt-1" style={themeStyles.textTertiary}>
              Versão beta em validação final.
            </Text>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={() => setAlertState((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );
}
