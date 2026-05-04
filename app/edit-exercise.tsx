import { CustomAlert } from '@/components/CustomAlert';
import { AppVideoPlayer } from '@/components/AppVideoPlayer';
import { WorkoutPrescriptionEditor } from '@/components/WorkoutPrescriptionEditor';
import { useAuthContext } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { DEFAULT_EXERCISES } from '@/src/data/defaultExercises';
import { createExercise, getExerciseById, updateExercise } from '@/src/services/exercises.service';
import { FreePlanLimitError, assertCanCreateResource } from '@/src/services/planLimits.service';
import { uploadExerciseVideo } from '@/src/services/storage.service';
import type { WorkoutExercise } from '@/src/types';
import { inferPrescriptionType } from '@/src/utils/workoutPrescription';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditExerciseScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { user } = useAuthContext();
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);
    const { exerciseId } = useLocalSearchParams();
    
    // Garantir que exerciseId seja sempre string (useLocalSearchParams pode retornar array)
    const exerciseIdString = Array.isArray(exerciseId) ? exerciseId[0] : exerciseId;
    
    // Estados (iguais ao create-exercise.tsx)
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
    const [equipment, setEquipment] = useState<string[]>([]);
    const [newMuscleGroup, setNewMuscleGroup] = useState('');
    const [newEquipment, setNewEquipment] = useState('');
    const [loading, setLoading] = useState(true);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [existingVideoURL, setExistingVideoURL] = useState<string | null>(null);
    const [removeStoredVideo, setRemoveStoredVideo] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [isDefaultExercise, setIsDefaultExercise] = useState(false);
    const [defaultPrescription, setDefaultPrescription] = useState<WorkoutExercise>({
        exerciseId: 'preview',
        order: 1,
        prescriptionType: 'strength',
    });

    // Estados para CustomAlert
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | null>(null);
    const [alertOnCancel, setAlertOnCancel] = useState<(() => void) | null>(null);
    const [alertShowCancel, setAlertShowCancel] = useState(false);
    const [alertConfirmText, setAlertConfirmText] = useState<string | undefined>(undefined);
    const [alertCancelText, setAlertCancelText] = useState<string | undefined>(undefined);

    // Função helper para mostrar alert customizado
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
        setAlertOnConfirm(() => onConfirm);
        setAlertOnCancel(() => options?.onCancel ?? null);
        setAlertShowCancel(options?.showCancel ?? false);
        setAlertConfirmText(options?.confirmText);
        setAlertCancelText(options?.cancelText);
        setAlertVisible(true);
    };

    useEffect(() => {
        const loadExercise = async () => {
            try {
                if (!exerciseIdString) return;
                const fallbackDefault = DEFAULT_EXERCISES.find((ex) => ex.id === exerciseIdString);
                if (fallbackDefault) {
                    setIsDefaultExercise(true);
                    setName(fallbackDefault.name || '');
                    setDescription(fallbackDefault.description || '');
                    setDifficulty(fallbackDefault.difficulty || 'beginner');
                    setMuscleGroups(fallbackDefault.muscleGroups || []);
                    setEquipment(fallbackDefault.equipment || []);
                    setExistingVideoURL(fallbackDefault.videoURL || null);
                    setVideoUri(null);
                    setRemoveStoredVideo(false);
                    setDefaultPrescription({
                        exerciseId: 'preview',
                        order: 1,
                        prescriptionType: 'strength',
                    });
                    return;
                }

                const exercise = await getExerciseById(exerciseIdString);
                if (exercise) {
                    setIsDefaultExercise(false);
                    setName(exercise.name || '');
                    setDescription(exercise.description || '');
                    setDifficulty(exercise.difficulty || 'beginner');
                    setMuscleGroups(exercise.muscleGroups || []);
                    setEquipment(exercise.equipment || []);
                    setExistingVideoURL(exercise.videoURL || null);
                    setVideoUri(null);
                    setRemoveStoredVideo(false);
                    setDefaultPrescription({
                        exerciseId: 'preview',
                        order: 1,
                        prescriptionType: exercise.defaultPrescription?.prescriptionType || 'strength',
                        protocolName: exercise.defaultPrescription?.protocolName,
                        rounds: exercise.defaultPrescription?.rounds,
                        roundRest: exercise.defaultPrescription?.roundRest,
                        intervalProtocol: exercise.defaultPrescription?.intervalProtocol,
                        sets: exercise.defaultPrescription?.sets,
                        reps: exercise.defaultPrescription?.reps,
                        duration: exercise.defaultPrescription?.duration,
                        restTime: exercise.defaultPrescription?.restTime,
                        notes: exercise.defaultPrescription?.notes,
                    });
                } else {
                    showAlert(t('common.error'), t('editExercise.notFound'), 'error', () => setTimeout(() => router.back(), 0));
                }
            } catch (error) {
                console.error('Error loading exercise:', error);
                showAlert(t('common.error'), t('editExercise.loadError'), 'error', () => setTimeout(() => router.back(), 0));
            } finally {
                setLoading(false);
            }
        };
        if (exerciseIdString) loadExercise();
    }, [exerciseIdString]);

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
            setRemoveStoredVideo(false);
        }
    };

    const clearPendingVideo = () => setVideoUri(null);

    const markRemoveStoredVideo = () => {
        setRemoveStoredVideo(true);
        setExistingVideoURL(null);
    };

    // PARTE 2: Função para salvar as alterações
    const handleUpdateExercise = async () => {
        // Validação (igual ao create)
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
      
        try {
            if (!exerciseIdString) {
                showAlert(t('common.error'), t('editExercise.invalidExercise'), 'error');
                return;
            }
            const patch: {
                name: string;
                description: string;
                difficulty: 'beginner' | 'intermediate' | 'advanced';
                muscleGroups: string[];
                equipment: string[];
                defaultPrescription?: {
                    prescriptionType?: 'strength' | 'timed' | 'interval' | 'circuit' | 'free';
                    protocolName?: string;
                    rounds?: number;
                    roundRest?: number;
                    intervalProtocol?: {
                        id: string;
                        name: string;
                        duration: number;
                        intensity?: 'low' | 'moderate' | 'high' | 'rest';
                        notes?: string;
                    }[];
                    sets?: number;
                    reps?: number;
                    duration?: number;
                    restTime?: number;
                    notes?: string;
                };
                videoURL?: string | null;
            } = {
                name: name.trim(),
                description: description.trim(),
                difficulty,
                muscleGroups,
                equipment: equipment.length > 0 ? equipment : [t('createExercise.noneEquipment')],
            };

            const normalizedPrescriptionType = inferPrescriptionType(defaultPrescription);
            const hasProtocol = (defaultPrescription.intervalProtocol || []).length > 0;
            const hasAnyPrescription =
                hasProtocol ||
                !!defaultPrescription.sets ||
                !!defaultPrescription.reps ||
                !!defaultPrescription.duration ||
                !!defaultPrescription.restTime ||
                !!defaultPrescription.notes?.trim();
            patch.defaultPrescription = hasAnyPrescription
                ? {
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
                  }
                : undefined;

            let newVideoUploadFailed = false;
            if (removeStoredVideo) {
                patch.videoURL = null;
            }

            if (isDefaultExercise) {
                if (!user?.id) {
                    showAlert(t('common.error'), t('editExercise.coachIdentifyError'), 'error');
                    return;
                }
                await assertCanCreateResource(user.id, 'exercises');
                const copiedExerciseId = `exercise_default_${exerciseIdString}_${user.id}`;
                await createExercise(user.id, {
                    id: copiedExerciseId,
                    name: patch.name,
                    description: patch.description,
                    difficulty: patch.difficulty,
                    muscleGroups: patch.muscleGroups,
                    equipment: patch.equipment,
                    defaultPrescription: patch.defaultPrescription,
                    videoURL: removeStoredVideo ? undefined : existingVideoURL ?? undefined,
                    thumbnailURL: undefined,
                    isGlobal: true,
                });
                if (videoUri) {
                    setUploadingVideo(true);
                    const url = await uploadExerciseVideo(videoUri, copiedExerciseId);
                    setUploadingVideo(false);
                    if (url) {
                        await updateExercise(copiedExerciseId, { videoURL: url });
                    } else {
                        newVideoUploadFailed = true;
                    }
                }
            } else {
                if (videoUri) {
                    setUploadingVideo(true);
                    const url = await uploadExerciseVideo(videoUri, exerciseIdString);
                    setUploadingVideo(false);
                    if (url) {
                        patch.videoURL = url;
                    } else {
                        newVideoUploadFailed = true;
                    }
                }
                await updateExercise(exerciseIdString!, patch);
            }
            if (newVideoUploadFailed) {
                showAlert(
                    t('editExercise.savedWithWarningTitle'),
                    t('editExercise.savedWithWarningBody'),
                    'warning',
                    () => setTimeout(() => router.back(), 0)
                );
            } else {
                showAlert(
                    t('common.success'),
                    isDefaultExercise
                        ? t('editExercise.defaultCustomizedSuccess')
                        : t('editExercise.updatedSuccess'),
                    'success',
                    () => setTimeout(() => router.back(), 0)
                );
            }
        } catch (error) {
            console.error('Error updating exercise:', error);
            if (error instanceof FreePlanLimitError) {
                showAlert(
                    t('editExercise.planLimitTitle'),
                    error.message,
                    'warning',
                    () => router.push('/subscription'),
                    {
                        showCancel: true,
                        confirmText: t('editExercise.viewPlans'),
                        cancelText: t('common.close'),
                    }
                );
                return;
            }
            showAlert(t('common.error'), t('editExercise.updateError'), 'error');
        }
    };

    // Funções auxiliares (iguais ao create-exercise.tsx)
    const addMuscleGroup = () => {
        if (newMuscleGroup.trim() && !muscleGroups.includes(newMuscleGroup.trim())) {
            setMuscleGroups([...muscleGroups, newMuscleGroup.trim()]);
            setNewMuscleGroup('');
        }
    };

    const removeMuscleGroup = (group: string) => {
        setMuscleGroups(muscleGroups.filter(g => g !== group));
    };

    const addEquipment = () => {
        if (newEquipment.trim() && !equipment.includes(newEquipment.trim())) {
            setEquipment([...equipment, newEquipment.trim()]);
            setNewEquipment('');
        }
    };

    const removeEquipment = (item: string) => {
        setEquipment(equipment.filter(e => e !== item));
    };

    // Mostrar loading enquanto carrega
    if (loading) {
        return (
            <View className="flex-1 items-center justify-center" style={themeStyles.bg}>
                <Text className="text-xl font-bold" style={themeStyles.text}>
                    {t('workoutTemplateDetails.loading')}
                </Text>
            </View>
        );
    }

    // PARTE 3: JSX (igual ao create-exercise.tsx, mas com título "Editar Exercício")
    return (
        <ScrollView className="flex-1 bg-dark-950" keyboardShouldPersistTaps="handled">
            <View className="px-6 pt-20 pb-20">
                {/* Header com botão voltar melhorado */}
                <TouchableOpacity
                    className="mb-6 flex-row items-center"
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <View className="bg-dark-800 border border-dark-700 rounded-full w-10 h-10 items-center justify-center mr-3">
                        <FontAwesome name="arrow-left" size={18} color="#fb923c" />
                    </View>
                    <Text className="text-primary-400 font-semibold text-lg">
                        {t('common.back')}
                    </Text>
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-white mb-2">
                    {t('editExercise.title')}
                </Text>
                <Text className="text-neutral-400 mb-6">
                    {t('editExercise.subtitle')}
                </Text>

                {/* Campo Nome */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
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

                {/* Campo Descrição */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
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
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Campo Dificuldade */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.difficultyLabel')}
                    </Text>
                    <View className="flex-row gap-3">
                        {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                            <TouchableOpacity
                                key={level}
                                className="flex-1 py-3 rounded-lg border-2"
                                style={{
                                  backgroundColor: difficulty === level 
                                    ? theme.colors.primary
                                    : theme.colors.card,
                                  borderColor: difficulty === level 
                                    ? theme.colors.primary
                                    : theme.colors.border,
                                }}
                                onPress={() => setDifficulty(level)}
                            >
                                <Text
                                    className="text-center font-semibold"
                                    style={{
                                      color: difficulty === level ? '#ffffff' : theme.colors.textSecondary
                                    }}
                                >
                                    {level === 'beginner'
                                      ? t('createExercise.difficultyBeginner')
                                      : level === 'intermediate'
                                        ? t('createExercise.difficultyIntermediate')
                                        : t('createExercise.difficultyAdvanced')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Grupos Musculares */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.muscleGroupsLabel')}
                    </Text>
                    <View className="flex-row gap-2 mb-2">
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
                            onSubmitEditing={addMuscleGroup}
                        />
                        <TouchableOpacity
                            className="rounded-lg px-6 py-3"
                            style={{ backgroundColor: theme.colors.primary }}
                            onPress={addMuscleGroup}
                        >
                            <Text className="font-semibold" style={{ color: '#ffffff' }}>+</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                        {muscleGroups.map((group, index) => (
                            <TouchableOpacity
                                key={index}
                                className="px-3 py-1 rounded-full flex-row items-center gap-2 border"
                                style={{
                                  backgroundColor: theme.mode === 'dark' 
                                    ? theme.colors.primary + '30'
                                    : theme.colors.primary + '20',
                                  borderColor: theme.colors.primary + '60',
                                }}
                                onPress={() => removeMuscleGroup(group)}
                            >
                                <Text style={{ color: theme.colors.primary }}>{group}</Text>
                                <Text style={{ color: theme.colors.primary }}>×</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Equipamentos */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.equipmentLabel')}
                    </Text>
                    <View className="flex-row gap-2 mb-2">
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
                            onSubmitEditing={addEquipment}
                        />
                        <TouchableOpacity
                            className="rounded-lg px-6 py-3"
                            style={{ backgroundColor: theme.colors.primary }}
                            onPress={addEquipment}
                        >
                            <Text className="font-semibold" style={{ color: '#ffffff' }}>+</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                        {equipment.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                className="px-3 py-1 rounded-full flex-row items-center gap-2 border"
                                style={themeStyles.cardSecondary}
                                onPress={() => removeEquipment(item)}
                            >
                                <Text style={themeStyles.textSecondary}>{item}</Text>
                                <Text style={themeStyles.textSecondary}>×</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="mb-5 rounded-xl p-4 border" style={themeStyles.cardSecondary}>
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
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

                {/* Vídeo (salvo no Firebase Storage; URL em coachemExercises) */}
                <View className="mb-6">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        {t('createExercise.videoTitle')}
                    </Text>
                    <Text className="text-xs mb-2" style={themeStyles.textSecondary}>
                        {t('editExercise.videoHint')}
                    </Text>
                    {existingVideoURL && !videoUri && !removeStoredVideo && (
                        <View className="rounded-xl overflow-hidden mb-3 border" style={{ borderColor: theme.colors.border }}>
                            <AppVideoPlayer
                                source={{ uri: existingVideoURL }}
                                style={{ width: '100%', height: 180 }}
                                nativeControls
                                contentFit="contain"
                                shouldPlay={false}
                            />
                        </View>
                    )}
                    {!videoUri ? (
                        <TouchableOpacity
                            className="flex-row items-center justify-center rounded-lg py-3 px-4 border-2 border-dashed mb-2"
                            style={{
                                borderColor: theme.colors.primary + '80',
                                backgroundColor: theme.mode === 'dark' ? theme.colors.primary + '15' : theme.colors.primary + '10',
                            }}
                            onPress={pickVideo}
                            disabled={uploadingVideo}
                        >
                            <FontAwesome name="video-camera" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                            <Text className="font-semibold" style={{ color: theme.colors.primary }}>
                                {uploadingVideo
                                  ? t('createExercise.uploadingVideo')
                                  : existingVideoURL && !removeStoredVideo
                                    ? t('editExercise.replaceVideo')
                                    : t('createExercise.selectVideo')}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="flex-row items-center rounded-lg py-3 px-4 border mb-2" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                            <FontAwesome name="check-circle" size={20} color="#10b981" style={{ marginRight: 8 }} />
                            <Text className="flex-1 font-medium" style={themeStyles.text} numberOfLines={1}>
                                {t('editExercise.newVideoSelected')}
                            </Text>
                            <TouchableOpacity onPress={clearPendingVideo} className="rounded-full px-3 py-1" style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                                <Text style={{ color: theme.colors.primary, fontSize: 12 }}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {existingVideoURL && !videoUri && !removeStoredVideo && (
                        <TouchableOpacity onPress={markRemoveStoredVideo} className="py-2">
                            <Text className="text-center text-sm" style={{ color: '#ef4444' }}>
                                {t('editExercise.removeSavedVideo')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Botão Salvar */}
                <TouchableOpacity
                    className="rounded-lg py-4 px-6"
                    style={{
                      backgroundColor: theme.colors.primary,
                      shadowOpacity: uploadingVideo ? 0.15 : 0.3,
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 8,
                      elevation: 6,
                      opacity: uploadingVideo ? 0.7 : 1,
                    }}
                    onPress={handleUpdateExercise}
                    disabled={uploadingVideo}
                >
                    <Text className="font-semibold text-center text-lg" style={{ color: '#ffffff' }}>
                        {t('editExercise.saveChanges')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertTitle}
                message={alertMessage}
                type={alertType}
                confirmText={alertConfirmText ?? t('common.ok')}
                cancelText={alertCancelText ?? t('common.cancel')}
                showCancel={alertShowCancel}
                onConfirm={() => {
                    setAlertVisible(false);
                    alertOnConfirm?.();
                }}
                onCancel={() => {
                    setAlertVisible(false);
                    alertOnCancel?.();
                }}
            />
        </ScrollView>
    );
}