import { CustomAlert } from '@/components/CustomAlert';
import { WorkoutPrescriptionEditor } from '@/components/WorkoutPrescriptionEditor';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { UserType } from '@/src/types';
import { useTheme } from '@/src/contexts/ThemeContext';
import { createExercise as createExerciseInFirestore, updateExercise } from '@/src/services/exercises.service';
import { FreePlanLimitError, assertCanCreateResource } from '@/src/services/planLimits.service';
import { uploadExerciseVideo } from '@/src/services/storage.service';
import type { Exercise, WorkoutExercise } from '@/src/types';
import { inferPrescriptionType } from '@/src/utils/workoutPrescription';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateExerciseScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { user } = useAuthContext();
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);

    const [name,setName] = useState('');
    const [description, setDescription] = useState('')
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
    const [equipment, setEquipment] = useState<string[]>([]);
    const [newMuscleGroup, setNewMuscleGroup] = useState('');
    const [newEquipment, setNewEquipment] = useState('');
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [defaultPrescription, setDefaultPrescription] = useState<WorkoutExercise>({
      exerciseId: 'preview',
      order: 1,
      prescriptionType: 'strength',
    });

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>();
    const [alertOnCancel, setAlertOnCancel] = useState<(() => void) | null>(null);
    const [alertShowCancel, setAlertShowCancel] = useState(false);
    const [alertConfirmText, setAlertConfirmText] = useState<string | undefined>(undefined);
    const [alertCancelText, setAlertCancelText] = useState<string | undefined>(undefined);

    const showAlert = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info',
        onConfirm?: () => void,
        options?: {
          showCancel?: boolean;
          onCancel?: () => void;
          confirmText?: string;
          cancelText?: string;
        }
    ) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertOnConfirm(onConfirm ? () => { setAlertVisible(false); onConfirm(); } : undefined);
        setAlertOnCancel(() => options?.onCancel ?? null);
        setAlertShowCancel(options?.showCancel ?? false);
        setAlertConfirmText(options?.confirmText);
        setAlertCancelText(options?.cancelText);
        setAlertVisible(true);
    };

    const handleConfirmAlert = () => {
        if (alertOnConfirm) alertOnConfirm();
        else setAlertVisible(false);
    };

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert(t('createExercise.permissionTitle'), t('createExercise.permissionBody'), 'warning');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsEditing: true,
          quality: 0.8,
          videoMaxDuration: 60,
        });
        if (!result.canceled && result.assets[0]) {
          setVideoUri(result.assets[0].uri);
        }
    };

    const removeVideo = () => setVideoUri(null);
    
    const handleSaveExercise = async () => {
        if (!name.trim()) {
          showAlert(t('common.error'), t('createExercise.errNameRequired'), 'error');
          return;
        }
        if (!description.trim()) {
          showAlert(t('common.error'), t('createExercise.errDescriptionRequired'), 'error');
          return;
        }
        if (muscleGroups.length === 0) {
          showAlert(t('common.error'), t('createExercise.errMuscleGroupRequired'), 'error');
          return;
        }

        const exerciseId = `exercise_${Date.now()}_${Math.random().toString(36).substring(2,9)}`;
        const coachId = user?.id || '';
        const normalizedPrescriptionType = inferPrescriptionType(defaultPrescription);
        const hasProtocol = (defaultPrescription.intervalProtocol || []).length > 0;
        const hasAnyPrescription =
          hasProtocol ||
          !!defaultPrescription.sets ||
          !!defaultPrescription.reps ||
          !!defaultPrescription.duration ||
          !!defaultPrescription.restTime ||
          !!defaultPrescription.notes?.trim();

        const payload: Parameters<typeof createExerciseInFirestore>[1] = {
          id: exerciseId,
          name: name.trim(),
          description: description.trim(),
          difficulty,
          muscleGroups,
          equipment: equipment.length > 0 ? equipment : [t('createExercise.noneEquipment')],
          defaultPrescription: hasAnyPrescription
            ? ({
                prescriptionType: normalizedPrescriptionType,
                protocolName: defaultPrescription.protocolName,
                rounds: defaultPrescription.rounds,
                roundRest: defaultPrescription.roundRest,
                intervalProtocol: defaultPrescription.intervalProtocol,
                sets: defaultPrescription.sets,
                reps: defaultPrescription.reps,
                duration: defaultPrescription.duration,
                restTime: defaultPrescription.restTime,
                notes: defaultPrescription.notes,
              } as Exercise['defaultPrescription'])
            : undefined,
          // Biblioteca pessoal do utilizador; só treinador pode marcar global na app.
          isGlobal: user?.userType === UserType.COACH,
        };

        try {
            if (!user?.id) {
              showAlert(t('common.error'), t('createExercise.errNeedLogin'), 'error');
              return;
            }
            await assertCanCreateResource(user.id, 'exercises');
            await createExerciseInFirestore(coachId, payload);

            let videoUploadFailed = false;
            if (videoUri) {
              setUploadingVideo(true);
              const videoURL = await uploadExerciseVideo(videoUri, exerciseId);
              setUploadingVideo(false);
              if (videoURL) {
                await updateExercise(exerciseId, { videoURL });
              } else {
                videoUploadFailed = true;
              }
            }

            if (videoUploadFailed) {
              showAlert(
                t('createExercise.createdTitle'),
                t('createExercise.createdVideoWarn', { name: payload.name }),
                'warning',
                () => setTimeout(() => router.back(), 0)
              );
            } else {
              showAlert(
                t('createExercise.createdSuccessTitle'),
                t('createExercise.createdSuccessBody', { name: payload.name }),
                'success',
                () => setTimeout(() => router.back(), 0)
              );
            }
        } catch (error) {
            setUploadingVideo(false);
            console.error('Error saving exercise:', error);
            if (error instanceof FreePlanLimitError) {
              showAlert(
                t('createExercise.planLimitTitle'),
                error.message,
                'warning',
                () => router.push('/subscription'),
                {
                  showCancel: true,
                  confirmText: t('createExercise.viewPlans'),
                  cancelText: t('common.close'),
                }
              );
              return;
            }
            showAlert(t('common.error'), t('createExercise.errSaveFailed'), 'error');
        }
      };

    return ( 
        <>
        <KeyboardAvoidingView
            style={[{ flex: 1 }, themeStyles.bg]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
        >
        <ScrollView
            className="flex-1"
            style={themeStyles.bg}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 28 }}
        >
            <View className="px-6 pt-20 pb-20 ">
                {/* Header com botão voltar melhorado */}
                <TouchableOpacity 
                 className="mb-6 flex-row items-center"
                 onPress={() => router.back()}
                 activeOpacity={0.7}
                >
                    <View className="rounded-full w-10 h-10 items-center justify-center mr-3 border" style={themeStyles.cardSecondary}>
                        <FontAwesome name="arrow-left" size={18} color={theme.colors.primary} />
                    </View>
                    <Text className="font-semibold text-lg" style={{ color: theme.colors.primary }}>
                        {t('common.back')}
                    </Text>
                </TouchableOpacity>

                <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
                    {t('createExercise.title')}
                </Text>
                <Text className="mb-6" style={themeStyles.textSecondary}>
                    {t('createExercise.subtitle')}
                </Text>

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.nameLabel')}
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder={t('createExercise.namePlaceholder')}
                        placeholderTextColor={theme.colors.textTertiary}
                        value={name}
                        onChangeText={setName}
                    />    

                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.descriptionLabel')}
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder={t('createExercise.descriptionPlaceholder')}
                        placeholderTextColor={theme.colors.textTertiary}
                        value={description}
                        onChangeText={setDescription}
                        multiline={true}
                        numberOfLines={4}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.difficultyLabel')}
                    </Text>

                    <View className="flex-row">
                        <TouchableOpacity 
                            className="w-1/3 py-3 px-1 rounded-lg border-2 mr-1"
                            style={{
                              borderColor: difficulty === 'beginner' ? theme.colors.primary : theme.colors.border,
                              backgroundColor: difficulty === 'beginner' 
                                ? (theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20')
                                : theme.colors.card,
                            }}
                            onPress={() => setDifficulty('beginner')}
                        >
                            <Text 
                            className="text-center font-semibold text-xs"
                            style={{
                              color: difficulty === 'beginner' ? theme.colors.primary : theme.colors.textSecondary
                            }}
                            numberOfLines={1}
                            >
                            {t('createExercise.difficultyBeginner')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className="w-1/3 py-3 px-1 rounded-lg border-2 mr-1"
                            style={{
                              borderColor: difficulty === 'intermediate' ? theme.colors.primary : theme.colors.border,
                              backgroundColor: difficulty === 'intermediate' 
                                ? (theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20')
                                : theme.colors.card,
                            }}
                            onPress={() => setDifficulty('intermediate')}
                        >
                            <Text 
                            className="text-center font-semibold text-xs"
                            style={{
                              color: difficulty === 'intermediate' ? theme.colors.primary : theme.colors.textSecondary
                            }}
                            numberOfLines={1}
                            >
                            {t('createExercise.difficultyIntermediate')}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            className="w-1/3 py-3 px-1 rounded-lg border-2"
                            style={{
                              borderColor: difficulty === 'advanced' ? theme.colors.primary : theme.colors.border,
                              backgroundColor: difficulty === 'advanced' 
                                ? (theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20')
                                : theme.colors.card,
                            }}
                            onPress={() => setDifficulty('advanced')}
                        >
                            <Text 
                            className="text-center font-semibold text-xs"
                            style={{
                              color: difficulty === 'advanced' ? theme.colors.primary : theme.colors.textSecondary
                            }}
                            numberOfLines={1}
                            >
                            {t('createExercise.difficultyAdvanced')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>

                <View className="mb-5 rounded-xl p-4 border" style={themeStyles.cardSecondary}>
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.defaultPrescriptionTitle')}
                    </Text>
                    <Text className="text-xs mb-2" style={themeStyles.textSecondary}>
                        {t('createExercise.defaultPrescriptionHint')}
                    </Text>
                    <WorkoutPrescriptionEditor
                        value={defaultPrescription}
                        onChange={(updates) =>
                          setDefaultPrescription((prev) => ({
                            ...prev,
                            ...updates,
                          }))
                        }
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.videoTitle')}
                    </Text>
                    <Text className="text-xs mb-2" style={themeStyles.textSecondary}>
                        {t('createExercise.videoHint')}
                    </Text>
                    {!videoUri ? (
                        <TouchableOpacity
                            className="flex-row items-center justify-center rounded-lg py-3 px-4 border-2 border-dashed"
                            style={{
                                borderColor: theme.colors.primary + '80',
                                backgroundColor: theme.mode === 'dark' ? theme.colors.primary + '15' : theme.colors.primary + '10',
                            }}
                            onPress={pickVideo}
                            disabled={uploadingVideo}
                        >
                            <FontAwesome name="video-camera" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                            <Text className="font-semibold" style={{ color: theme.colors.primary }}>
                                {uploadingVideo ? t('createExercise.uploadingVideo') : t('createExercise.selectVideo')}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="flex-row items-center rounded-lg py-3 px-4 border" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                            <FontAwesome name="check-circle" size={20} color="#10b981" style={{ marginRight: 8 }} />
                            <Text className="flex-1 font-medium" style={themeStyles.text} numberOfLines={1}>
                                {t('createExercise.videoSelected')}
                            </Text>
                            <TouchableOpacity onPress={removeVideo} className="rounded-full px-3 py-1" style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                                <Text style={{ color: theme.colors.primary, fontSize: 12 }}>{t('createExercise.removeVideo')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.muscleGroupsLabel')}
                    </Text>

                    <View className="flex-row gap-2 mb-3">
                        <TextInput
                         className="flex-1 border rounded-lg px-4 py-3"
                         style={{
                           backgroundColor: theme.colors.card,
                           borderColor: theme.colors.border,
                           color: theme.colors.text,
                         }}
                         placeholder={t('createExercise.muscleGroupsPlaceholder')}
                         placeholderTextColor={theme.colors.textTertiary}
                         value={newMuscleGroup}
                         onChangeText={setNewMuscleGroup}
                        />
                        <TouchableOpacity
                         className="rounded-lg px-4 py-3 justify-center"
                         style={{ backgroundColor: theme.colors.primary }}
                         onPress={() => {
                            if (newMuscleGroup.trim() !== '') {
                                setMuscleGroups([...muscleGroups, newMuscleGroup.trim()]);
                                setNewMuscleGroup('');
                            }
                         }}
                        >
                            <Text className="font-semibold" style={{ color: '#ffffff' }}>
                                +
                            </Text>

                        </TouchableOpacity>

                    </View>

                    {muscleGroups.length > 0 ? (
                        <View className="flex-row flex-wrap gap-2">
                            {muscleGroups.map((group, index) => (
                                <View
                                    key={index}
                                    className="rounded-lg px-3 py-2 flex-row items-center border"
                                    style={{
                                      backgroundColor: theme.mode === 'dark' 
                                        ? theme.colors.primary + '30'
                                        : theme.colors.primary + '20',
                                      borderColor: theme.colors.primary + '60',
                                    }}
                                >
                                    <Text className="text-sm mr-2" style={{ color: theme.colors.primary }}>
                                        {group}
                                    </Text>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setMuscleGroups(muscleGroups.filter((_, i) => i !== index));
                                        }}
                                    >
                                        <Text className="font-bold" style={{ color: theme.colors.primary }}>
                                            ×
                                        </Text>
                                    </TouchableOpacity>
                                </View>    
                            ))}
                        </View>
                    ) : (
                        <Text className="text-sm" style={themeStyles.textTertiary}>
                            {t('createExercise.noMuscleGroups')}
                        </Text>
                    )}

                    {/* Campo: Equipamentos */}
                        <View className="mb-4">
                        <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                            {t('createExercise.equipmentLabel')}
                        </Text>
                        
                        <View className="flex-row gap-2 mb-3">
                            <TextInput
                            className="flex-1 border rounded-lg px-4 py-3"
                            style={{
                              backgroundColor: theme.colors.card,
                              borderColor: theme.colors.border,
                              color: theme.colors.text,
                            }}
                            placeholder={t('createExercise.equipmentPlaceholder')}
                            placeholderTextColor={theme.colors.textTertiary}
                            value={newEquipment}
                            onChangeText={setNewEquipment}
                            />
                            <TouchableOpacity
                            className="rounded-lg px-4 py-3 justify-center"
                            style={{ backgroundColor: theme.colors.primary }}
                            onPress={() => {
                                if (newEquipment.trim() !== '') {
                                setEquipment([...equipment, newEquipment.trim()]);
                                setNewEquipment('');
                                }
                            }}
                            >
                            <Text className="font-semibold" style={{ color: '#ffffff' }}>+</Text>
                            </TouchableOpacity>
                        </View>

                        {equipment.length > 0 ? (
                            <View className="flex-row flex-wrap gap-2">
                            {equipment.map((item, index) => (
                                <View
                                key={index}
                                className="rounded-lg px-3 py-2 flex-row items-center border"
                                style={{
                                  backgroundColor: theme.mode === 'dark' 
                                    ? theme.colors.primary + '30'
                                    : theme.colors.primary + '20',
                                  borderColor: theme.colors.primary + '60',
                                }}
                                >
                                <Text className="text-sm mr-2" style={{ color: theme.colors.primary }}>
                                    {item}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => {
                                    setEquipment(equipment.filter((_, i) => i !== index));
                                    }}
                                >
                                    <Text className="font-bold" style={{ color: theme.colors.primary }}>×</Text>
                                </TouchableOpacity>
                                </View>
                            ))}
                            </View>
                        ) : (
                            <Text className="text-sm" style={themeStyles.textTertiary}>
                            {t('createExercise.noEquipment')}
                            </Text>
                        )}
                        </View>

                </View>

                                {/* Botão Salvar */}
                <TouchableOpacity
                className="rounded-lg py-4 px-6 mt-6"
                style={{
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                  opacity: uploadingVideo ? 0.7 : 1,
                }}
                onPress={handleSaveExercise}
                disabled={uploadingVideo}
                >
                <Text className="font-semibold text-center text-lg" style={{ color: '#ffffff' }}>
                    {uploadingVideo ? t('createExercise.saving') : t('createExercise.saveButton')}
                </Text>
                </TouchableOpacity>


            </View>

        </ScrollView>
        </KeyboardAvoidingView>

        <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            type={alertType}
            confirmText={alertConfirmText ?? t('common.ok')}
            cancelText={alertCancelText ?? t('common.cancel')}
            showCancel={alertShowCancel}
            onConfirm={handleConfirmAlert}
            onCancel={() => {
                setAlertVisible(false);
                alertOnCancel?.();
            }}
        />
        </>
    )
}