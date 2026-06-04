/**
 * Perfil do atleta — convites, ligar treinador (solo), desvincular (coached).
 */

import { CustomAlert } from '@/components/CustomAlert';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
  acceptCoachInvite,
  linkAthleteToCoachByCode,
  subscribePendingInvitesForEmail,
  syncCoachemAthleteWithUserLink,
  unlinkAthleteFromCoach,
  type CoachInviteDoc,
} from '@/src/services/coachInvites.service';
import { UserType } from '@/src/types';
import { isCoachedAthlete, isSoloAthlete } from '@/src/types/athleteMode';
import { formatCoachGraceRemaining } from '@/src/utils/coachUnlinkGrace';
import { getThemeStyles } from '@/src/utils/themeStyles';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function AthleteCoachLinkPanel() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const { user, refreshUser } = useAuthContext();
  const [invites, setInvites] = useState<CoachInviteDoc[]>([]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const email = user?.email?.toLowerCase() ?? '';
  const graceDays = formatCoachGraceRemaining(user);

  useEffect(() => {
    if (!email || !user || user.userType !== UserType.ATHLETE) {
      setInvites([]);
      return;
    }
    if (isCoachedAthlete(user)) {
      setInvites([]);
      void syncCoachemAthleteWithUserLink().catch(() => undefined);
      return;
    }
    return subscribePendingInvitesForEmail(email, setInvites);
  }, [email, user]);

  if (!user || user.userType !== UserType.ATHLETE) return null;

  const showAlert = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'error' | 'warning'
  ) => setAlert({ visible: true, title, message, type });

  const afterLinkSuccess = async (message: string) => {
    await refreshUser();
    try {
      await syncCoachemAthleteWithUserLink();
    } catch {
      /* function ainda não deployada — aceite já gravou users */
    }
    showAlert(t('common.success'), message, 'success');
  };

  const linkByCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await linkAthleteToCoachByCode(code);
      setCode('');
      await afterLinkSuccess(t('athleteCoachLink.linked', { name: res.coachDisplayName }));
    } catch (e: unknown) {
      showAlert(
        t('common.error'),
        e instanceof Error ? e.message : t('athleteCoachLink.linkError'),
        'error'
      );
    } finally {
      setBusy(false);
    }
  };

  const accept = async (inviteId: string) => {
    setBusy(true);
    try {
      await acceptCoachInvite(inviteId);
      await afterLinkSuccess(t('athleteCoachLink.inviteAccepted'));
    } catch (e: unknown) {
      showAlert(
        t('common.error'),
        e instanceof Error ? e.message : t('athleteCoachLink.acceptError'),
        'error'
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmUnlink = () => setUnlinkConfirmOpen(true);

  const doUnlink = async () => {
    setBusy(true);
    try {
      const res = await unlinkAthleteFromCoach();
      await refreshUser();
      const ends = res.coachAccessEndsAt
        ? new Date(res.coachAccessEndsAt).toLocaleDateString()
        : '';
      showAlert(
        t('common.success'),
        t('athleteCoachLink.unlinked', { date: ends }),
        'success'
      );
    } catch (e: unknown) {
      showAlert(
        t('common.error'),
        e instanceof Error ? e.message : t('athleteCoachLink.unlinkError'),
        'error'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-sm font-medium mb-3" style={themeStyles.textSecondary}>
        {t('athleteCoachLink.sectionTitle')}
      </Text>

      {isCoachedAthlete(user) && (
        <View className="rounded-2xl border p-4 mb-4" style={{ borderColor: theme.colors.border }}>
          <Text className="text-sm mb-3" style={themeStyles.textSecondary}>
            {t('athleteCoachLink.coachedHint')}
          </Text>
          <TouchableOpacity
            onPress={confirmUnlink}
            disabled={busy}
            className="rounded-xl py-3 items-center border"
            style={{ borderColor: theme.colors.border, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text className="font-semibold text-sm" style={{ color: theme.colors.primary }}>
                {t('athleteCoachLink.unlinkButton')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isSoloAthlete(user) && graceDays != null && (
        <Text className="text-xs mb-3" style={themeStyles.textSecondary}>
          {t('athleteCoachLink.graceRemaining', { days: graceDays })}
        </Text>
      )}

      {isSoloAthlete(user) && invites.length > 0 && (
        <View className="rounded-2xl border p-4 mb-4" style={{ borderColor: theme.colors.border }}>
          <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
            {t('athleteCoachLink.pendingInvites')}
          </Text>
          {invites.map((inv) => (
            <View
              key={inv.id}
              className="flex-row items-center justify-between py-2 border-t border-neutral-800"
            >
              <Text className="text-xs flex-1" style={themeStyles.textSecondary}>
                {t('athleteCoachLink.inviteFromCoach')}
              </Text>
              <TouchableOpacity
                onPress={() => accept(inv.id)}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <Text className="text-xs font-semibold text-black">{t('athleteCoachLink.accept')}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {isSoloAthlete(user) && (
        <View className="rounded-2xl border p-4" style={{ borderColor: theme.colors.border }}>
          <Text className="text-xs mb-2" style={themeStyles.textSecondary}>
            {t('athleteCoachLink.codeHint')}
          </Text>
          <TextInput
            className="rounded-xl px-4 py-3 mb-3 border text-base"
            style={{
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
            }}
            placeholder={t('registerAthlete.coachCodePlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            onPress={linkByCode}
            disabled={busy}
            className="rounded-xl py-3 items-center"
            style={{ backgroundColor: theme.colors.primary, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="font-semibold text-black">{t('athleteCoachLink.linkButton')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <CustomAlert
        visible={unlinkConfirmOpen}
        title={t('athleteCoachLink.unlinkTitle')}
        message={t('athleteCoachLink.unlinkMessage')}
        type="warning"
        showCancel
        confirmText={t('athleteCoachLink.unlinkConfirm')}
        cancelText={t('common.cancel')}
        onCancel={() => setUnlinkConfirmOpen(false)}
        onConfirm={() => {
          setUnlinkConfirmOpen(false);
          void doUnlink();
        }}
      />

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={() => setAlert((a) => ({ ...a, visible: false }))}
      />
    </View>
  );
}
