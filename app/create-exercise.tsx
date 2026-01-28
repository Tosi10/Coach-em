import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';

export default function CreateExerciseScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);

    const [name,setName] = useState('');
    const [description, setDescription] = useState('')
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
    const [equipment, setEquipment] = useState<string[]>([]);
    const [duration, setDuration] = useState('');
    const [newMuscleGroup, setNewMuscleGroup] = useState('');
    const [newEquipment, setNewEquipment] = useState('');
    
    const handleSaveExercise = async () => {
        // Validação dos campos obrigatórios
        if (!name.trim()) {
          Alert.alert('Erro', 'Por favor, preencha o nome do exercício.');
          return;
        }
      
        if (!description.trim()) {
          Alert.alert('Erro', 'Por favor, preencha a descrição do exercício.');
          return;
        }
      
        if (muscleGroups.length === 0) {
          Alert.alert('Erro', 'Por favor, adicione pelo menos um grupo muscular.');
          return;
        }
      
        // Criar o objeto do exercício
        const newExercise = {
          id: `exercise_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
          name: name.trim(),
          description: description.trim(),
          difficulty: difficulty,
          muscleGroups: muscleGroups,
          equipment: equipment.length > 0 ? equipment : ['Nenhum'],
          duration: duration ? parseInt(duration) : undefined,
          createdBy: 'coach1', // Temporário (depois virá do usuário logado)
          isGlobal: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      
        try {
            console.log('💾 Tentando salvar exercício:', newExercise);
            
            const existingExerciseJson = await AsyncStorage.getItem('saved_exercises');
            console.log('📦 Exercícios existentes (JSON):', existingExerciseJson);
            
            const existingExercises = existingExerciseJson
            ? JSON.parse(existingExerciseJson)
            : [];
            
            console.log('📋 Exercícios existentes (parseados):', existingExercises);

            const updatedExercises = [...existingExercises, newExercise];
            
            console.log('🔄 Array atualizado:', updatedExercises);
            console.log('📊 Total de exercícios após adicionar:', updatedExercises.length);

            await AsyncStorage.setItem('saved_exercises', JSON.stringify(updatedExercises));
            
            console.log('✅ Exercício salvo com sucesso no AsyncStorage!');

            Alert.alert(
                'Exercício Criado!',
                `O exercício "${newExercise.name}" foi criado com sucesso!`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
        } catch (error) {
            console.error('❌ Erro ao salvar exercício:', error);
            Alert.alert('Erro', 'Não foi possível salvar o exercício. Tente novamente.');
        }


       
      
        // TODO: Depois vamos salvar no Firebase aqui
        // await saveExerciseToFirebase(newExercise);
      };

    return ( 
        <ScrollView className="flex-1" style={themeStyles.bg}>
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
                        Voltar
                    </Text>
                </TouchableOpacity>

                <Text className="text-3xl font-bold mb-2" style={themeStyles.text}>
                    Criar Novo Exercício
                </Text>
                <Text className="mb-6" style={themeStyles.textSecondary}>
                    Preencha os dados do exercício
                </Text>

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
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

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
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
                        value={description}
                        onChangeText={setDescription}
                        multiline={true}
                        numberOfLines={4}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        Dificuldade *
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
                            Iniciante
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
                            Intermediário
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
                            Avançado
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
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
                     value={duration}
                     onChangeText={setDuration}
                     keyboardType="numeric"
                    />

                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                        Grupos Musculares *
                    </Text>

                    <View className="flex-row gap-2 mb-3">
                        <TextInput
                         className="flex-1 border rounded-lg px-4 py-3"
                         style={{
                           backgroundColor: theme.colors.card,
                           borderColor: theme.colors.border,
                           color: theme.colors.text,
                         }}
                         placeholder="Ex: pernas, peito, costas..."
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
                            Nenhum grupo muscular adicionado ainda
                        </Text>
                    )}

                    {/* Campo: Equipamentos */}
                        <View className="mb-4">
                        <Text className="text-sm font-semibold mb-2" style={themeStyles.text}>
                            Equipamentos
                        </Text>
                        
                        <View className="flex-row gap-2 mb-3">
                            <TextInput
                            className="flex-1 border rounded-lg px-4 py-3"
                            style={{
                              backgroundColor: theme.colors.card,
                              borderColor: theme.colors.border,
                              color: theme.colors.text,
                            }}
                            placeholder="Ex: Halteres, Barra, Banco..."
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
                            Nenhum equipamento adicionado ainda
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
                }}
                onPress={handleSaveExercise}
                >
                <Text className="font-semibold text-center text-lg" style={{ color: '#ffffff' }}>
                    💾 Salvar Exercício
                </Text>
                </TouchableOpacity>


            </View>

        </ScrollView>
    )
}