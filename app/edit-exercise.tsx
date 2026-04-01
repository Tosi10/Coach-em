import { CustomAlert } from '@/components/CustomAlert';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getExerciseById, updateExercise } from '@/src/services/exercises.service';
import { uploadExerciseVideo } from '@/src/services/storage.service';
import { getThemeStyles } from '@/src/utils/themeStyles';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditExerciseScreen() {
    const router = useRouter();
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
    const [duration, setDuration] = useState('');
    const [newMuscleGroup, setNewMuscleGroup] = useState('');
    const [newEquipment, setNewEquipment] = useState('');
    const [loading, setLoading] = useState(true);
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [existingVideoURL, setExistingVideoURL] = useState<string | null>(null);
    const [removeStoredVideo, setRemoveStoredVideo] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    // Estados para CustomAlert
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | null>(null);

    // Função helper para mostrar alert customizado
    const showAlert = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info',
        onConfirm?: () => void
    ) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertOnConfirm(() => onConfirm);
        setAlertVisible(true);
    };

    useEffect(() => {
        const loadExercise = async () => {
            try {
                if (!exerciseIdString) return;
                const exercise = await getExerciseById(exerciseIdString);
                if (exercise) {
                    setName(exercise.name || '');
                    setDescription(exercise.description || '');
                    setDifficulty(exercise.difficulty || 'beginner');
                    setMuscleGroups(exercise.muscleGroups || []);
                    setEquipment(exercise.equipment || []);
                    setDuration(exercise.duration ? exercise.duration.toString() : '');
                    setExistingVideoURL(exercise.videoURL || null);
                    setVideoUri(null);
                    setRemoveStoredVideo(false);
                } else {
                    showAlert('Erro', 'Exercício não encontrado.', 'error', () => setTimeout(() => router.back(), 0));
                }
            } catch (error) {
                console.error('Erro ao carregar exercício:', error);
                showAlert('Erro', 'Não foi possível carregar o exercício.', 'error', () => setTimeout(() => router.back(), 0));
            } finally {
                setLoading(false);
            }
        };
        if (exerciseIdString) loadExercise();
    }, [exerciseIdString]);

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permissão necessária', 'Precisamos acessar sua galeria para escolher um vídeo.', 'warning');
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
            showAlert('Erro', 'Por favor, preencha o nome do exercício.', 'error');
            return;
        }
      
        if (!description.trim()) {
            showAlert('Erro', 'Por favor, preencha a descrição do exercício.', 'error');
            return;
        }
      
        if (muscleGroups.length === 0) {
            showAlert('Erro', 'Por favor, adicione pelo menos um grupo muscular.', 'error');
            return;
        }
      
        try {
            const patch: Parameters<typeof updateExercise>[1] = {
                name: name.trim(),
                description: description.trim(),
                difficulty,
                muscleGroups,
                equipment: equipment.length > 0 ? equipment : ['Nenhum'],
                duration: duration ? parseInt(duration, 10) : undefined,
            };

            let newVideoUploadFailed = false;
            if (videoUri) {
                setUploadingVideo(true);
                const url = await uploadExerciseVideo(videoUri, exerciseIdString!);
                setUploadingVideo(false);
                if (url) {
                    patch.videoURL = url;
                } else {
                    newVideoUploadFailed = true;
                }
            } else if (removeStoredVideo) {
                patch.videoURL = null;
            }

            await updateExercise(exerciseIdString!, patch);
            if (newVideoUploadFailed) {
                showAlert(
                    'Salvo com aviso',
                    'Alterações salvas, mas o novo vídeo não foi enviado. Verifique o Firebase Storage e tente substituir o vídeo de novo.',
                    'warning',
                    () => setTimeout(() => router.back(), 0)
                );
            } else {
                showAlert('Sucesso', 'Exercício atualizado com sucesso!', 'success', () => setTimeout(() => router.back(), 0));
            }
        } catch (error) {
            console.error('Erro ao atualizar exercício:', error);
            showAlert('Erro', 'Não foi possível atualizar o exercício.', 'error');
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
                    Carregando...
                </Text>
            </View>
        );
    }

    // PARTE 3: JSX (igual ao create-exercise.tsx, mas com título "Editar Exercício")
    return (
        <ScrollView className="flex-1 bg-dark-950">
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
                        Voltar
                    </Text>
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-white mb-2">
                    Editar Exercício
                </Text>
                <Text className="text-neutral-400 mb-6">
                    Atualize as informações do exercício
                </Text>

                {/* Campo Nome */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Nome do Exercício *
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Ex: Agachamento"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Campo Descrição */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Descrição *
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Descreva o exercício..."
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
                        Dificuldade *
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
                                    {level === 'beginner' ? 'Iniciante' : level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Grupos Musculares */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Grupos Musculares *
                    </Text>
                    <View className="flex-row gap-2 mb-2">
                        <TextInput
                            className="flex-1 border rounded-lg px-4 py-3"
                            style={{
                              backgroundColor: theme.colors.card,
                              borderColor: theme.colors.border,
                              color: theme.colors.text,
                            }}
                            placeholder="Ex: pernas"
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
                        Equipamentos
                    </Text>
                    <View className="flex-row gap-2 mb-2">
                        <TextInput
                            className="flex-1 border rounded-lg px-4 py-3"
                            style={{
                              backgroundColor: theme.colors.card,
                              borderColor: theme.colors.border,
                              color: theme.colors.text,
                            }}
                            placeholder="Ex: Barra"
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

                {/* Duração */}
                <View className="mb-4">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Duração (segundos)
                    </Text>
                    <TextInput
                        className="border rounded-lg px-4 py-3"
                        style={{
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        }}
                        placeholder="Ex: 60"
                        placeholderTextColor={theme.colors.textTertiary}
                        keyboardType="numeric"
                        value={duration}
                        onChangeText={setDuration}
                    />
                </View>

                {/* Vídeo (salvo no Firebase Storage; URL em coachemExercises) */}
                <View className="mb-6">
                    <Text className="font-semibold mb-2" style={themeStyles.text}>
                        Vídeo do exercício (opcional)
                    </Text>
                    <Text className="text-xs mb-2" style={themeStyles.textSecondary}>
                        O atleta vê este vídeo ao abrir o exercício no treino. Troque ou remova quando quiser.
                    </Text>
                    {existingVideoURL && !videoUri && !removeStoredVideo && (
                        <View className="rounded-xl overflow-hidden mb-3 border" style={{ borderColor: theme.colors.border }}>
                            <Video
                                source={{ uri: existingVideoURL }}
                                style={{ width: '100%', height: 180 }}
                                useNativeControls
                                resizeMode={ResizeMode.CONTAIN}
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
                                {uploadingVideo ? 'Enviando vídeo...' : existingVideoURL && !removeStoredVideo ? 'Substituir vídeo' : 'Selecionar vídeo'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="flex-row items-center rounded-lg py-3 px-4 border mb-2" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border }}>
                            <FontAwesome name="check-circle" size={20} color="#10b981" style={{ marginRight: 8 }} />
                            <Text className="flex-1 font-medium" style={themeStyles.text} numberOfLines={1}>
                                Novo vídeo selecionado
                            </Text>
                            <TouchableOpacity onPress={clearPendingVideo} className="rounded-full px-3 py-1" style={{ backgroundColor: theme.colors.backgroundTertiary }}>
                                <Text style={{ color: theme.colors.primary, fontSize: 12 }}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {existingVideoURL && !videoUri && !removeStoredVideo && (
                        <TouchableOpacity onPress={markRemoveStoredVideo} className="py-2">
                            <Text className="text-center text-sm" style={{ color: '#ef4444' }}>
                                Remover vídeo salvo
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
                        💾 Salvar Alterações
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertVisible}
                title={alertTitle}
                message={alertMessage}
                type={alertType}
                confirmText="OK"
                onConfirm={() => {
                    setAlertVisible(false);
                    alertOnConfirm?.();
                }}
            />
        </ScrollView>
    );
}