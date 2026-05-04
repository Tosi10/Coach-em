/**
 * Aba Perfil – configurações e conta
 *
 * Treinador e atleta: dados do usuário, tema, trocar senha, logout, excluir conta.
 */

import { ThemeToggle } from '@/components/ThemeToggle';
import { CustomAlert } from '@/components/CustomAlert';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { UserType } from '@/src/types';
import { syncCoachPublicProfileToAthletes } from '@/src/services/athletes.service';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, loading, changePassword, deleteAccount, updateProfilePhoto, updateDisplayName } = useAuthContext();
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
  const [nameSavedVisible, setNameSavedVisible] = useState(false);
  const [photoSavedVisible, setPhotoSavedVisible] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameBusy, setNameBusy] = useState(false);
  const [coachWelcomeMessage, setCoachWelcomeMessage] = useState('');
  const [coachPublicName, setCoachPublicName] = useState('');
  const [savingCoachMessage, setSavingCoachMessage] = useState(false);
  const hydratedCoachFieldsUserIdRef = useRef<string | null>(null);

  const MAX_COACH_MESSAGE_LENGTH = 180;

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('profile.permissionGallery'),
        t('profile.permissionGalleryMsg')
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
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
      setPhotoSavedVisible(true);
    } catch (e: any) {
      Alert.alert(
        t('profile.photoErrorTitle'),
        e?.message ?? t('profile.photoErrorBody')
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

  const openNameModal = () => {
    setNameDraft(user?.displayName ?? '');
    setNameModalOpen(true);
  };

  const submitDisplayName = async () => {
    const normalized = nameDraft.trim().replace(/\s+/g, ' ');
    if (normalized.length < 2) {
      Alert.alert(t('profile.nameFieldTitle'), t('profile.nameMin'));
      return;
    }
    if (normalized.length > 60) {
      Alert.alert(t('profile.nameFieldTitle'), t('profile.nameMax'));
      return;
    }

    setNameBusy(true);
    try {
      await updateDisplayName(normalized);
      setNameModalOpen(false);
      setNameSavedVisible(true);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('profile.nameUpdateError'));
    } finally {
      setNameBusy(false);
    }
  };

  const submitChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      Alert.alert(t('profile.fieldsTitle'), t('profile.fieldsPassword'));
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert(t('profile.passwordsMismatch'), t('profile.passwordsMismatchMsg'));
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert(t('profile.passwordShort'), t('profile.passwordShortMsg'));
      return;
    }
    setPwdBusy(true);
    try {
      await changePassword(currentPwd, newPwd);
      setChangeModalOpen(false);
      Alert.alert(t('profile.passwordChangedTitle'), t('profile.passwordChangedMsg'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('profile.passwordChangeError'));
    } finally {
      setPwdBusy(false);
    }
  };

  const confirmDeleteAccount = () => {
    setDeleteConfirmVisible(true);
  };

  const submitDeleteAccount = async () => {
    if (!deletePwd.trim()) {
      Alert.alert(t('profile.passwordShort'), t('profile.deleteNeedPassword'));
      return;
    }
    setDeleteBusy(true);
    try {
      await deleteAccount(deletePwd);
      await AsyncStorage.multiRemove(['userType', 'currentAthleteId']);
      setDeleteModalOpen(false);
      router.replace('/(auth)/login');
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('profile.deleteError'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const openSupportEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=Suporte%20Coach%27em`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(t('profile.supportTitle'), t('profile.supportOpenEmailError', { email: SUPPORT_EMAIL }));
      return;
    }
    await Linking.openURL(url);
  };

  const openSupportWhatsApp = async () => {
    const url = `https://wa.me/${SUPPORT_WHATSAPP_E164}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(t('profile.supportTitle'), t('profile.supportWhatsAppError'));
      return;
    }
    await Linking.openURL(url);
  };

  const openPolicy = async () => {
    const canOpen = await Linking.canOpenURL(TREINA_PRIVACY_URL);
    if (!canOpen) {
      Alert.alert(t('profile.privacyTitle'), t('profile.privacyOpenError'));
      return;
    }
    await Linking.openURL(TREINA_PRIVACY_URL);
  };

  const openTerms = async () => {
    const canOpen = await Linking.canOpenURL(TREINA_TERMS_URL);
    if (!canOpen) {
      Alert.alert(t('profile.termsTitle'), t('profile.termsOpenError'));
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
      Alert.alert(t('profile.coachMessageSection'), t('profile.messageTooLong', { max: MAX_COACH_MESSAGE_LENGTH }));
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
      Alert.alert(t('common.error'), e?.message ?? t('profile.messageSaveError'));
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
    if (!isCoach || !user?.id) {
      hydratedCoachFieldsUserIdRef.current = null;
      return;
    }

    // Hidrata os campos apenas uma vez por usuário logado,
    // evitando sobrescrever texto enquanto o treinador está digitando.
    if (hydratedCoachFieldsUserIdRef.current === user.id) return;

    setCoachWelcomeMessage((user as any)?.welcomeMessage ?? '');
    setCoachPublicName((user as any)?.publicCoachName ?? user?.displayName ?? '');
    hydratedCoachFieldsUserIdRef.current = user.id;
  }, [isCoach, user?.id, user?.displayName]);

  return (
    <ScrollView className="flex-1" style={themeStyles.bg} keyboardShouldPersistTaps="handled">
      <View
        className="px-6 pb-20"
        style={{ paddingTop: insets.top + (isCoach ? 20 : 20) }}
      >
        <Text className="text-2xl font-bold mb-1" style={themeStyles.text}>
          {t('profile.title')}
        </Text>
        <Text className="mb-6 text-sm" style={themeStyles.textSecondary}>
          {t('profile.subtitle')}
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
                {user?.displayName ?? t('common.user')}
              </Text>
              <Text className="text-sm" style={themeStyles.textSecondary}>
                {user?.email}
              </Text>
              <TouchableOpacity onPress={openNameModal} activeOpacity={0.7} className="mt-2 self-start">
                <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
                  {t('profile.editName')}
                </Text>
              </TouchableOpacity>
              <View
                className="mt-1.5 self-start rounded-lg px-2.5 py-1"
                style={{ backgroundColor: theme.colors.primary + '20' }}
              >
                <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
                  {isCoach ? t('common.coach') : t('common.athlete')}
                </Text>
              </View>
            </View>
          </View>
          <Text className="text-xs" style={themeStyles.textSecondary}>
            {t('profile.tapPhoto')}
          </Text>
          <View className="mt-4 pt-4" style={{ borderTopColor: theme.colors.border, borderTopWidth: 1 }}>
            <View className="flex-row items-end" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-xs font-medium mb-2" style={themeStyles.textSecondary}>
                  {t('profile.languageSection')}
                </Text>
                <View
                  className="rounded-xl border p-1 flex-row"
                  style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }}
                >
                  <TouchableOpacity
                    className="flex-1 py-2.5 rounded-lg items-center"
                    style={{
                      backgroundColor:
                        language === 'pt-BR'
                          ? theme.mode === 'dark'
                            ? theme.colors.primary + '2e'
                            : theme.colors.primary + '1f'
                          : 'transparent',
                    }}
                    onPress={() => void setLanguage('pt-BR')}
                    activeOpacity={0.85}
                  >
                    <Text
                      className="font-semibold text-xs"
                      style={{ color: language === 'pt-BR' ? theme.colors.primary : theme.colors.textSecondary }}
                    >
                      {t('profile.languagePortuguese')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 py-2.5 rounded-lg items-center"
                    style={{
                      backgroundColor:
                        language === 'en'
                          ? theme.mode === 'dark'
                            ? theme.colors.primary + '2e'
                            : theme.colors.primary + '1f'
                          : 'transparent',
                    }}
                    onPress={() => void setLanguage('en')}
                    activeOpacity={0.85}
                  >
                    <Text
                      className="font-semibold text-xs"
                      style={{ color: language === 'en' ? theme.colors.primary : theme.colors.textSecondary }}
                    >
                      {t('profile.languageEnglish')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="items-start">
                <Text className="text-xs font-medium mb-2" style={themeStyles.textSecondary}>
                  {t('profile.appearance')}
                </Text>
                <ThemeToggle />
              </View>
            </View>
          </View>
        </View>

        {isCoach && (
          <View className="mb-6">
            <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
              {t('profile.planSection')}
            </Text>
            <View className="rounded-2xl border overflow-hidden" style={{ borderColor: theme.colors.border, borderWidth: 1 }}>
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4"
                style={{ backgroundColor: theme.colors.card }}
                onPress={() => router.push('/subscription')}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <FontAwesome name="credit-card-alt" size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
                  <View className="flex-1">
                    <Text className="font-semibold" style={themeStyles.text}>
                      {t('profile.planRowTitle')}
                    </Text>
                    <Text className="text-xs mt-0.5" style={themeStyles.textSecondary} numberOfLines={2}>
                      {t('profile.planRowSubtitle')}
                    </Text>
                  </View>
                </View>
                <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isCoach && (
          <View className="mb-6">
            <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
              {t('profile.coachMessageSection')}
            </Text>
            <View className="rounded-2xl border p-4" style={[themeStyles.card, { borderWidth: 1 }]}>
              <TextInput
                value={coachPublicName}
                onChangeText={setCoachPublicName}
                placeholder={t('profile.publicNamePlaceholder')}
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
                onChangeText={setCoachWelcomeMessage}
                placeholder={t('profile.welcomePlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                maxLength={MAX_COACH_MESSAGE_LENGTH}
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
                    {savingCoachMessage ? t('profile.savingMessage') : t('profile.saveMessage')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
          {t('profile.security')}
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
                {t('profile.changePassword')}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {isCoach && (
          <>
            <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
              {t('profile.supportSection')}
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
                      {t('profile.supportEmail')}
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
                      {t('profile.supportWhatsApp')}
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
          {t('profile.legal')}
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
                {t('profile.privacyPolicy')}
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
                {t('profile.termsOfUse')}
              </Text>
            </View>
            <FontAwesome name="external-link" size={14} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
          {t('profile.account')}
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
                {t('profile.logout')}
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
                {t('profile.deleteAccount')}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View className="mt-8 rounded-xl py-3 px-4" style={{ backgroundColor: theme.colors.backgroundSecondary }}>
          <Text className="text-xs text-center" style={themeStyles.textTertiary}>
            {t('profile.forgotPasswordHint')}
          </Text>
        </View>
      </View>

      <Modal
        visible={nameModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setNameModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <TouchableOpacity className="absolute inset-0" activeOpacity={1} onPress={() => setNameModalOpen(false)} />
          <View
            className="mx-5 rounded-3xl px-5 pt-6 pb-8"
            style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }}
          >
            <Text className="text-lg font-semibold mb-2" style={themeStyles.text}>
              {t('profile.editNameModalTitle')}
            </Text>
            <Text className="text-sm mb-4" style={themeStyles.textSecondary}>
              {t('profile.editNameModalHint')}
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3 mb-5 text-base"
              style={inputStyle}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder={t('profile.namePlaceholderModal')}
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={60}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center border"
                style={{ borderColor: theme.colors.border }}
                onPress={() => setNameModalOpen(false)}
                disabled={nameBusy}
              >
                <Text className="font-semibold" style={themeStyles.text}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center"
                style={{ backgroundColor: theme.colors.primary }}
                onPress={submitDisplayName}
                disabled={nameBusy}
              >
                {nameBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-semibold text-white">{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={changeModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setChangeModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <TouchableOpacity className="absolute inset-0" activeOpacity={1} onPress={() => setChangeModalOpen(false)} />
          <View
            className="mx-5 rounded-3xl px-5 pt-6 pb-8"
            style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }}
          >
            <Text className="text-lg font-semibold mb-4" style={themeStyles.text}>
              {t('profile.changePasswordModalTitle')}
            </Text>
            <Text className="text-sm mb-2" style={themeStyles.textSecondary}>
              {t('profile.currentPassword')}
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
              {t('profile.newPassword')}
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3 mb-3 text-base"
              style={inputStyle}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder={t('profile.newPasswordPlaceholder')}
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text className="text-sm mb-2" style={themeStyles.textSecondary}>
              {t('profile.confirmNewPassword')}
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3 mb-5 text-base"
              style={inputStyle}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              placeholder={t('profile.repeatNewPassword')}
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
                  {t('common.cancel')}
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
                  <Text className="font-semibold text-white">{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={deleteModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setDeleteModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        >
          <TouchableOpacity className="absolute inset-0" activeOpacity={1} onPress={() => setDeleteModalOpen(false)} />
          <View
            className="mx-5 rounded-3xl px-5 pt-6 pb-8"
            style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }}
          >
            <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.error }}>
              {t('profile.deleteModalTitle')}
            </Text>
            <Text className="text-sm mb-4" style={themeStyles.textSecondary}>
              {t('profile.deleteModalHint')}
            </Text>
            <TextInput
              className="w-full rounded-xl px-4 py-3 mb-5 text-base"
              style={inputStyle}
              secureTextEntry
              value={deletePwd}
              onChangeText={setDeletePwd}
              placeholder={t('profile.deletePlaceholder')}
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
                  {t('common.cancel')}
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
                  <Text className="font-semibold text-white">{t('profile.deleteButton')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={deleteConfirmVisible}
        title={t('profile.deleteConfirmTitle')}
        message={t('profile.deleteConfirmMsg')}
        type="warning"
        confirmText={t('common.continue')}
        cancelText={t('common.cancel')}
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
        title={t('profile.messageSavedTitle')}
        message={t('profile.messageSavedBody')}
        type="success"
        confirmText={t('common.ok')}
        onConfirm={() => setCoachMessageSavedVisible(false)}
        onCancel={() => setCoachMessageSavedVisible(false)}
      />

      <CustomAlert
        visible={nameSavedVisible}
        title={t('profile.nameSavedTitle')}
        message={t('profile.nameSavedBody')}
        type="success"
        confirmText={t('common.ok')}
        onConfirm={() => setNameSavedVisible(false)}
        onCancel={() => setNameSavedVisible(false)}
      />

      <CustomAlert
        visible={photoSavedVisible}
        title={t('profile.photoSavedTitle')}
        message={t('profile.photoSavedBody')}
        type="success"
        confirmText={t('common.ok')}
        onConfirm={() => setPhotoSavedVisible(false)}
        onCancel={() => setPhotoSavedVisible(false)}
      />
    </ScrollView>
  );
}
