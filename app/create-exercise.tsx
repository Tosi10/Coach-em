import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CreateExerciseScreen() {
    const router = useRouter();

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
        <ScrollView className="flex-1 bg-dark-950">
            <View className="px-6 pt-20 pb-20 ">
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
                    Criar Novo Exercício
                </Text>
                <Text className="text-neutral-400 mb-6">
                    Preencha os dados do exercício
                </Text>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-300 mb-2">
                        Nome do Exercício *
                    </Text>
                    <TextInput
                        className="bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white"
                        placeholder="Ex: Agachamento"
                        placeholderTextColor="#737373"
                        value={name}
                        onChangeText={setName}
                    />    

                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-300 mb-2">
                        Descrição *
                    </Text>
                    <TextInput
                        className="bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white"
                        placeholder="Descreva o exercício..."
                        placeholderTextColor="#737373"
                        value={description}
                        onChangeText={setDescription}
                        multiline={true}
                        numberOfLines={4}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-300 mb-2">
                        Dificuldade *
                    </Text>

                    <View className="flex-row">
                        <TouchableOpacity 
                            className={`w-1/3 py-3 px-1 rounded-lg border-2 mr-1 ${
                            difficulty === 'beginner'
                                ? 'border-primary-500 bg-primary-500/20'
                                : 'border-dark-700 bg-dark-900'
                            }`}
                            onPress={() => setDifficulty('beginner')}
                        >
                            <Text 
                            className={`text-center font-semibold text-xs ${
                                difficulty === 'beginner'
                                ? 'text-primary-400'
                                : 'text-neutral-300'
                            }`}
                            numberOfLines={1}
                            >
                            Iniciante
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className={`w-1/3 py-3 px-1 rounded-lg border-2 mr-1 ${
                            difficulty === 'intermediate'
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-neutral-200 bg-neutral-50'
                            }`}
                            onPress={() => setDifficulty('intermediate')}
                        >
                            <Text 
                            className={`text-center font-semibold text-xs ${
                                difficulty === 'intermediate'
                                ? 'text-primary-600'
                                : 'text-neutral-600'
                            }`}
                            numberOfLines={1}
                            >
                            Intermediário
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            className={`w-1/3 py-3 px-1 rounded-lg border-2 ${
                            difficulty === 'advanced'
                                ? 'border-primary-500 bg-primary-500/20'
                                : 'border-dark-700 bg-dark-900'
                            }`}
                            onPress={() => setDifficulty('advanced')}
                        >
                            <Text 
                            className={`text-center font-semibold text-xs ${
                                difficulty === 'advanced'
                                ? 'text-primary-400'
                                : 'text-neutral-300'
                            }`}
                            numberOfLines={1}
                            >
                            Avançado
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-300 mb-2">
                        Duração (segundos)
                    </Text>
                    <TextInput
                     className="bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white"
                     placeholder="Ex: 60"
                     placeholderTextColor="#737373"
                     value={duration}
                     onChangeText={setDuration}
                     keyboardType="numeric"
                    >

                    </TextInput>

                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-300 mb-2">
                        Grupos Musculares *
                    </Text>

                    <View className="flex-row gap-2 mb-3">
                        <TextInput
                         className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white"
                         placeholder="Ex: pernas, peito, costas..."
                         placeholderTextColor="#737373"
                         value={newMuscleGroup}
                         onChangeText={setNewMuscleGroup}
                        />
                        <TouchableOpacity
                         className="bg-primary-500 rounded-lg px-4 py-3 justify-center"
                         onPress={() => {
                            if (newMuscleGroup.trim() !== '') {
                                setMuscleGroups([...muscleGroups, newMuscleGroup.trim()]);
                                setNewMuscleGroup('');
                            }
                         }}
                        >
                            <Text className="text-white font-semibold">
                                +
                            </Text>

                        </TouchableOpacity>

                    </View>

                    {muscleGroups.length > 0 ? (
                        <View className="flex-row flex-wrap gap-2">
                            {muscleGroups.map((group, index) => (
                                <View
                                    key={index}
                                    className="bg-primary-500/20 border border-primary-500/30 rounded-lg px-3 py-2 flex-row items-center"
                                >
                                    <Text className="text-primary-400 text-sm mr-2">
                                        {group}
                                    </Text>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setMuscleGroups(muscleGroups.filter((_, i) => i !== index));
                                        }}
                                    >
                                        <Text className="text-primary-400 font-bold">
                                            ×
                                        </Text>
                                    </TouchableOpacity>
                                </View>    
                            ))}
                        </View>
                    ) : (
                        <Text className="text-neutral-500 text-sm">
                            Nenhum grupo muscular adicionado ainda
                        </Text>
                    )}

                    {/* Campo: Equipamentos */}
                        <View className="mb-4">
                        <Text className="text-sm font-semibold text-neutral-300 mb-2">
                            Equipamentos
                        </Text>
                        
                        <View className="flex-row gap-2 mb-3">
                            <TextInput
                            className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-white"
                            placeholder="Ex: Halteres, Barra, Banco..."
                            placeholderTextColor="#737373"
                            value={newEquipment}
                            onChangeText={setNewEquipment}
                            />
                            <TouchableOpacity
                            className="bg-primary-500 rounded-lg px-4 py-3 justify-center"
                            onPress={() => {
                                if (newEquipment.trim() !== '') {
                                setEquipment([...equipment, newEquipment.trim()]);
                                setNewEquipment('');
                                }
                            }}
                            >
                            <Text className="text-white font-semibold">+</Text>
                            </TouchableOpacity>
                        </View>

                        {equipment.length > 0 ? (
                            <View className="flex-row flex-wrap gap-2">
                            {equipment.map((item, index) => (
                                <View
                                key={index}
                                className="bg-primary-500/20 border border-primary-500/30 rounded-lg px-3 py-2 flex-row items-center"
                                >
                                <Text className="text-primary-400 text-sm mr-2">
                                    {item}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => {
                                    setEquipment(equipment.filter((_, i) => i !== index));
                                    }}
                                >
                                    <Text className="text-primary-400 font-bold">×</Text>
                                </TouchableOpacity>
                                </View>
                            ))}
                            </View>
                        ) : (
                            <Text className="text-neutral-500 text-sm">
                            Nenhum equipamento adicionado ainda
                            </Text>
                        )}
                        </View>

                </View>

                                {/* Botão Salvar */}
                <TouchableOpacity
                className="bg-primary-500 rounded-lg py-4 px-6 mt-6"
                style={{
                  shadowColor: '#fb923c',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                onPress={handleSaveExercise}
                >
                <Text className="text-white font-semibold text-center text-lg">
                    💾 Salvar Exercício
                </Text>
                </TouchableOpacity>


            </View>

        </ScrollView>
    )
}