/**
 * Aba Perfil – configurações e conta
 *
 * Treinador e atleta: dados do usuário, tema, trocar senha, logout, excluir conta.
 */

import { ThemeToggle } from '@/components/ThemeToggle';
import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { UserType } from '@/src/types';
import { syncCoachPublicProfileToAthletes } from '@/src/services/athletes.service';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/src/services/firebase.config';
import { TREINA_PRIVACY_URL, TREINA_TERMS_URL } from '@/src/constants/legalUrls';

const INPUT_BORDER_WIDTH = 1;
const inputBorderColor = (isDark: boolean) =>
  isDark ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.2)';
const SUPPORT_EMAIL = 'adm.ecg.19@gmail.com';
const SUPPORT_WHATSAPP_E164 = '5541992522854';
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, loading, changePassword, deleteAccount, updateProfilePhoto } = useAuthContext();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const isDark = theme.mode === 'dark';
  const fieldBorder = inputBorderColor(isDark);

  const [loggingOut, setLoggingOut] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [deletePwd, setDeletePwd] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [coachMessageSavedVisible, setCoachMessageSavedVisible] = useState(false);
  const [coachWelcomeMessage, setCoachWelcomeMessage] = useState('');
  const [coachPublicName, setCoachPublicName] = useState('');
  const [savingCoachMessage, setSavingCoachMessage] = useState(false);

  const MAX_COACH_MESSAGE_LENGTH = 180;

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão',
        'Precisamos acessar a galeria para você escolher a foto de perfil.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setPhotoUploading(true);
    try {
      await updateProfilePhoto(result.assets[0].uri);
      if (isCoach && user?.id) {
        const freshUserSnap = await getDoc(doc(db, 'users', user.id));
        const latestPhotoURL =
          (freshUserSnap.data()?.photoURL as string | undefined) ?? (user as any)?.photoURL;
        await syncCoachPublicProfileToAthletes(user.id, {
          coachPhotoURL: latestPhotoURL,
          coachPublicName: coachPublicName.trim() || user.displayName,
          coachWelcomeMessage: coachWelcomeMessage.trim(),
        });
      }
      Alert.alert('Foto de perfil', 'Foto atualizada com sucesso.');
    } catch (e: any) {
      Alert.alert(
        'Foto de perfil',
        e?.message ??
          'Não foi possível enviar a foto. Confira o Firebase Storage e as regras de segurança.'
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      await AsyncStorage.removeItem('userType');
      await AsyncStorage.removeItem('currentAthleteId');
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Erro ao sair:', e);
      setLoggingOut(false);
    }
  };

  const openChangeModal = () => {
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setChangeModalOpen(true);
  };

  const submitChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      Alert.alert('Campos', 'Preencha senha atual e nova senha.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Senhas', 'A confirmação não coincide com a nova senha.');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('Senha', 'A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setPwdBusy(true);
    try {
      await changePassword(currentPwd, newPwd);
      setChangeModalOpen(false);
      Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível alterar a senha.');
    } finally {
      setPwdBusy(false);
    }
  };

  const confirmDeleteAccount = () => {
    setDeleteConfirmVisible(true);
  };

  const submitDeleteAccount = async () => {
    if (!deletePwd.trim()) {
      Alert.alert('Senha', 'Digite sua senha atual para confirmar a exclusão.');
      return;
    }
    setDeleteBusy(true);
    try {
      await deleteAccount(deletePwd);
      await AsyncStorage.multiRemove(['userType', 'currentAthleteId']);
      setDeleteModalOpen(false);
      router.replace('/(auth)/login');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível excluir a conta.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const openSupportEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=Suporte%20Treina%2B`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Suporte', `Não foi possível abrir o email. Contato: ${SUPPORT_EMAIL}`);
      return;
    }
    await Linking.openURL(url);
  };

  const openSupportWhatsApp = async () => {
    const url = `https://wa.me/${SUPPORT_WHATSAPP_E164}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Suporte', 'Não foi possível abrir o WhatsApp no momento.');
      return;
    }
    await Linking.openURL(url);
  };

  const openPolicy = async () => {
    const canOpen = await Linking.canOpenURL(TREINA_PRIVACY_URL);
    if (!canOpen) {
      Alert.alert('Privacidade', 'Não foi possível abrir a Política de Privacidade.');
      return;
    }
    await Linking.openURL(TREINA_PRIVACY_URL);
  };

  const openTerms = async () => {
    const canOpen = await Linking.canOpenURL(TREINA_TERMS_URL);
    if (!canOpen) {
      Alert.alert('Termos', 'Não foi possível abrir os Termos de Uso.');
      return;
    }
    await Linking.openURL(TREINA_TERMS_URL);
  };

  const isCoach = user?.userType === UserType.COACH;

  const saveCoachWelcomeMessage = async () => {
    if (!user?.id || !isCoach) return;
    const normalizedName = coachPublicName.trim();
    const normalized = coachWelcomeMessage.trim();
    if (normalized.length > MAX_COACH_MESSAGE_LENGTH) {
      Alert.alert('Mensagem', `Use no máximo ${MAX_COACH_MESSAGE_LENGTH} caracteres.`);
      return;
    }
    setSavingCoachMessage(true);
    try {
      const freshUserSnap = await getDoc(doc(db, 'users', user.id));
      const latestPhotoURL =
        (freshUserSnap.data()?.photoURL as string | undefined) ?? (user as any)?.photoURL;
      await updateDoc(doc(db, 'users', user.id), {
        publicCoachName: normalizedName || user.displayName,
        welcomeMessage: normalized,
        updatedAt: serverTimestamp(),
      });
      await syncCoachPublicProfileToAthletes(user.id, {
        coachPublicName: normalizedName || user.displayName,
        coachWelcomeMessage: normalized,
        coachPhotoURL: latestPhotoURL,
      });
      setCoachMessageSavedVisible(true);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível salvar a mensagem.');
    } finally {
      setSavingCoachMessage(false);
    }
  };

  const inputStyle = {
    backgroundColor: theme.colors.background,
    borderWidth: INPUT_BORDER_WIDTH,
    borderColor: fieldBorder,
    color: theme.colors.text,
  };

  useEffect(() => {
    if (isCoach) {
      setCoachWelcomeMessage((user as any)?.welcomeMessage ?? '');
      setCoachPublicName((user as any)?.publicCoachName ?? user?.displayName ?? '');
    }
  }, [isCoach, user]);

  return (
    <ScrollView className="flex-1" style={themeStyles.bg} keyboardShouldPersistTaps="handled">
      <View
        className="px-6 pb-20"
        style={{ paddingTop: insets.top + (isCoach ? 20 : 20) }}
      >
        <Text className="text-2xl font-bold mb-1" style={themeStyles.text}>
          Perfil
        </Text>
        <Text className="mb-6 text-sm" style={themeStyles.textSecondary}>
          Configurações da sua conta
        </Text>

        <View
          className="rounded-2xl p-5 mb-6 border"
          style={[themeStyles.card, { borderWidth: 1 }]}
        >
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={pickProfilePhoto}
              disabled={photoUploading}
              activeOpacity={0.8}
              className="relative"
            >
              <View
                className="w-14 h-14 rounded-full items-center justify-center overflow-hidden"
                style={{ backgroundColor: theme.colors.primary + '25' }}
              >
                {user?.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    style={{ width: 56, height: 56 }}
                    resizeMode="cover"
                  />
                ) : isCoach ? (
                  <FontAwesome name="user" size={26} color={theme.colors.primary} />
                ) : (
                  <FontAwesome name="user" size={26} color={theme.colors.primary} />
                )}
                {photoUploading && (
                  <View
                    className="absolute inset-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                  >
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold" style={themeStyles.text}>
                {user?.displayName ?? 'Usuário'}
              </Text>
              <Text className="text-sm" style={themeStyles.textSecondary}>
                {user?.email}
              </Text>
              <View
                className="mt-1.5 self-start rounded-lg px-2.5 py-1"
                style={{ backgroundColor: theme.colors.primary + '20' }}
              >
                <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
                  {isCoach ? 'Treinador' : 'Atleta'}
                </Text>
              </View>
            </View>
          </View>
          <Text className="text-xs" style={themeStyles.textSecondary}>
            Toque na foto para escolher uma imagem da galeria.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
            Aparência
          </Text>
          <View className="rounded-2xl border p-4" style={[themeStyles.card, { borderWidth: 1 }]}>
            <ThemeToggle />
          </View>
        </View>

        {isCoach && (
          <View className="mb-6">
            <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
              Mensagem para atletas
            </Text>
            <View className="rounded-2xl border p-4" style={[themeStyles.card, { borderWidth: 1 }]}>
              <TextInput
                value={coachPublicName}
                onChangeText={setCoachPublicName}
                placeholder="Nome exibido para seus atletas"
                placeholderTextColor={theme.colors.textSecondary}
                style={[
                  inputStyle,
                  {
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 10,
                  },
                ]}
              />
              <TextInput
                value={coachWelcomeMessage}
                onChangeText={(text) => setCoachWelcomeMessage(text.slice(0, MAX_COACH_MESSAGE_LENGTH))}
                placeholder="Ex: Foco total essa semana. Qualquer dúvida, me chame."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                textAlignVertical="top"
                style={[
                  inputStyle,
                  {
                    minHeight: 88,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    marginBottom: 10,
                  },
                ]}
              />
              <View className="flex-row items-center justify-between">
                <Text className="text-xs" style={themeStyles.textSecondary}>
                  {coachWelcomeMessage.length}/{MAX_COACH_MESSAGE_LENGTH}
                </Text>
                <TouchableOpacity
                  onPress={saveCoachWelcomeMessage}
                  disabled={savingCoachMessage}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: theme.colors.primary,
                    opacity: savingCoachMessage ? 0.6 : 1,
                  }}
                >
                  <Text className="text-xs font-semibold text-black">
                    {savingCoachMessage ? 'Salvando...' : 'Salvar mensagem'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
          Segurança
        </Text>
        <View
          className="rounded-2xl border overflow-hidden mb-6"
          style={{ borderColor: theme.colors.border, borderWidth: 1 }}
        >
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4 border-b"
            style={{
              backgroundColor: theme.colors.card,
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
            }}
            onPress={openChangeModal}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <FontAwesome name="lock" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
              <Text className="font-semibold" style={themeStyles.text}>
                Alterar senha
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {isCoach && (
          <>
            <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
              Suporte Vision10
            </Text>
            <View
              className="rounded-2xl border overflow-hidden mb-6"
              style={{ borderColor: theme.colors.border, borderWidth: 1 }}
            >
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4 border-b"
                style={{
                  backgroundColor: theme.colors.card,
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: 1,
                }}
                onPress={openSupportEmail}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <FontAwesome name="envelope-o" size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
                  <View className="flex-1">
                    <Text className="font-semibold" style={themeStyles.text}>
                      Email de suporte
                    </Text>
                    <Text className="text-xs mt-0.5" style={themeStyles.textSecondary} numberOfLines={1}>
                      {SUPPORT_EMAIL}
                    </Text>
                  </View>
                </View>
                <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4"
                style={{ backgroundColor: theme.colors.card }}
                onPress={openSupportWhatsApp}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <FontAwesome name="whatsapp" size={20} color="#25D366" style={{ marginRight: 12 }} />
                  <View className="flex-1">
                    <Text className="font-semibold" style={themeStyles.text}>
                      WhatsApp de suporte
                    </Text>
                    <Text className="text-xs mt-0.5" style={themeStyles.textSecondary}>
                      +55 41 99252-2854
                    </Text>
                  </View>
                </View>
                <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
          Jurídico
        </Text>
        <View
          className="rounded-2xl border overflow-hidden mb-6"
          style={{ borderColor: theme.colors.border, borderWidth: 1 }}
        >
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4 border-b"
            style={{
              backgroundColor: theme.colors.card,
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
            }}
            onPress={openPolicy}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <FontAwesome name="shield" size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
              <Text className="font-semibold" style={themeStyles.text}>
                Política de Privacidade
              </Text>
            </View>
            <FontAwesome name="external-link" size={14} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4"
            style={{ backgroundColor: theme.colors.card }}
            onPress={openTerms}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <FontAwesome name="file-text-o" size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
              <Text className="font-semibold" style={themeStyles.text}>
                Termos de Uso
              </Text>
            </View>
            <FontAwesome name="external-link" size={14} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
          Conta
        </Text>
        <View
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: theme.colors.border, borderWidth: 1 }}
        >
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4 border-b"
            style={{
              backgroundColor: theme.colors.card,
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
            }}
            onPress={handleLogout}
            disabled={loading || loggingOut}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <FontAwesome name="sign-out" size={20} color={theme.colors.error} style={{ marginRight: 12 }} />
              <Text className="font-semibold" style={{ color: theme.colors.error }}>
                Sair da conta
              </Text>
            </View>
            {loading || loggingOut ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-4"
            style={{ backgroundColor: theme.colors.card }}
            onPress={confirmDeleteAccount}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <FontAwesome name="trash-o" size={20} color={theme.colors.error} style={{ marginRight: 12 }} />
              <Text className="font-semibold" style={{ color: theme.colors.error }}>
                Excluir conta
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View className="mt-8 rounded-xl py-3 px-4" style={{ backgroundColor: theme.colors.backgroundSecondary }}>
          <Text className="text-xs text-center" style={themeStyles.textTertiary}>
            Esqueceu a senha? Use &quot;Esqueci minha senha&quot; na tela de login para receber o link por email.
          </Text>
        </View>
      </View>

      <Modal visible={changeModalOpen} animationType="slide" transparent onRequestClose={() => setChangeModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setChangeModalOpen(false)} />
          <View
            className="rounded-t-3xl px-5 pt-6 pb-10"
            style={{ backgroundColor: theme.colors.card, borderTopWidth: 1, borderColor: theme.colors.border }}
          >
            <Text className="text-lg font-semibold mb-4" style={themeStyles.text}>
              Alterar senha
            </Text>
            <Text className="text-sm mb-2" style={themeStyles.textSecondary}>
              Senha atual
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3 mb-3 text-base"
              style={inputStyle}
              secureTextEntry
              value={currentPwd}
              onChangeText={setCurrentPwd}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text className="text-sm mb-2" style={themeStyles.textSecondary}>
              Nova senha
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3 mb-3 text-base"
              style={inputStyle}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text className="text-sm mb-2" style={themeStyles.textSecondary}>
              Confirmar nova senha
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3 mb-5 text-base"
              style={inputStyle}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              placeholder="Repita a nova senha"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center border"
                style={{ borderColor: theme.colors.border }}
                onPress={() => setChangeModalOpen(false)}
                disabled={pwdBusy}
              >
                <Text className="font-semibold" style={themeStyles.text}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: theme.colors.primary }}
                onPress={submitChangePassword}
                disabled={pwdBusy}
              >
                {pwdBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={deleteModalOpen} animationType="slide" transparent onRequestClose={() => setDeleteModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setDeleteModalOpen(false)} />
          <View
            className="rounded-t-3xl px-5 pt-6 pb-10"
            style={{ backgroundColor: theme.colors.card, borderTopWidth: 1, borderColor: theme.colors.border }}
          >
            <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.error }}>
              Excluir conta
            </Text>
            <Text className="text-sm mb-4" style={themeStyles.textSecondary}>
              Digite sua senha atual para confirmar. Sua conta de autenticação e seu perfil serão removidos.
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3 mb-5 text-base"
              style={inputStyle}
              secureTextEntry
              value={deletePwd}
              onChangeText={setDeletePwd}
              placeholder="Senha atual"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center border"
                style={{ borderColor: theme.colors.border }}
                onPress={() => setDeleteModalOpen(false)}
                disabled={deleteBusy}
              >
                <Text className="font-semibold" style={themeStyles.text}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: theme.colors.error }}
                onPress={submitDeleteAccount}
                disabled={deleteBusy}
              >
                {deleteBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={deleteConfirmVisible}
        title="Excluir conta"
        message="Esta ação é permanente. Seus dados de perfil serão removidos. Treinos e histórico podem permanecer conforme as regras do app. Deseja continuar?"
        type="warning"
        confirmText="Continuar"
        cancelText="Cancelar"
        showCancel
        onConfirm={() => {
          setDeleteConfirmVisible(false);
          setDeletePwd('');
          setDeleteModalOpen(true);
        }}
        onCancel={() => setDeleteConfirmVisible(false)}
      />

      <CustomAlert
        visible={coachMessageSavedVisible}
        title="Mensagem salva"
        message="Sua mensagem para atletas foi atualizada."
        type="success"
        confirmText="OK"
        onConfirm={() => setCoachMessageSavedVisible(false)}
        onCancel={() => setCoachMessageSavedVisible(false)}
      />
    </ScrollView>
  );
}
