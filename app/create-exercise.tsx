import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';


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
    
    const handleSaveExercise = () => {
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
          id: Date.now().toString(), // ID temporário (depois virá do Firebase)
          name: name.trim(),
          description: description.trim(),
          difficulty: difficulty,
          muscleGroups: muscleGroups,
          equipment: equipment.length > 0 ? equipment : ['Nenhum'],
          duration: duration ? parseInt(duration) : undefined,
          createdBy: 'coach1', // Temporário (depois virá do usuário logado)
          isGlobal: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      
        // Por enquanto, apenas mostrar sucesso
        // Depois vamos salvar no Firebase
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
      
        // TODO: Depois vamos salvar no Firebase aqui
        // await saveExerciseToFirebase(newExercise);
      };

    return ( 
        <ScrollView className="flex-1 bg-white">
            <View className="px-6 pt-12 pb-20 ">
                <TouchableOpacity 
                 className="mb-6 "
                 onPress={() => router.back()}
                >
                    <Text className="text-primary-600 font-semibold text-lg">
                        ← Voltar

                    </Text>
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-neutral-900 mb-2">
                    Criar Novo Exercício

                </Text>
                <Text className="text-neutral-600 mb-6">
                    Preencha os dados do exercício
                </Text>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                        Nome do Exercício *
                    </Text>
                    <TextInput
                        className="bg-neutral-50  border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                        placeholder="Ex: Agachamento"
                        placeholderTextColor="#9ca3af"
                        value={name}
                        onChangeText={setName}
                    />    

                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                        Descrição *
                    </Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                        placeholder="Descreva o exercício..."
                        placeholderTextColor="#9CA3AF"
                        value={description}
                        onChangeText={setDescription}
                        multiline={true}
                        numberOfLines={4}
                    />
                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                        Dificuldade *

                    </Text>

                    <View className="flex-row">
                        <TouchableOpacity 
                            className={`w-1/3 py-3 px-1 rounded-lg border-2 mr-1 ${
                            difficulty === 'beginner'
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-neutral-200 bg-neutral-50'
                            }`}
                            onPress={() => setDifficulty('beginner')}
                        >
                            <Text 
                            className={`text-center font-semibold text-xs ${
                                difficulty === 'beginner'
                                ? 'text-primary-600'
                                : 'text-neutral-600'
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
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-neutral-200 bg-neutral-50'
                            }`}
                            onPress={() => setDifficulty('advanced')}
                        >
                            <Text 
                            className={`text-center font-semibold text-xs ${
                                difficulty === 'advanced'
                                ? 'text-primary-600'
                                : 'text-neutral-600'
                            }`}
                            numberOfLines={1}
                            >
                            Avançado
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                        Duração (segundos)

                    </Text>
                    <TextInput
                     className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                     placeholder="Ex: 60"
                     placeholderTextColor="#9CA3AF"
                     value={duration}
                     onChangeText={setDuration}
                     keyboardType="numeric"
                    >

                    </TextInput>

                </View>

                <View className="mb-4">
                    <Text className="text-sm font-semibold text-neutral-700 mb-2">
                        Grupos Musculares *

                    </Text>

                    <View className="flex-row gap-2 mb-3">
                        <TextInput
                         className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                         placeholder="Ex: pernas, peito, costas..."
                         placeholderTextColor="#9CA3AF"
                         value={newMuscleGroup}
                         onChangeText={setNewMuscleGroup}
                        />
                        <TouchableOpacity
                         className="bg-primary-600 rounded-lg px-4 py-3 justify-center"
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
                                    className="bg-primary-100 rounded-lg px-3 py-2 flex-row items-center"
                                >
                                    <Text className="text-primary-700 text-sm mr-2">
                                        {group}
                                    </Text>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setMuscleGroups(muscleGroups.filter((_, i) => i !== index));
                                        }}
                                    >
                                        <Text className="text-primary-700 font-bold">
                                            ×
                                        </Text>
                                    </TouchableOpacity>
                                </View>    
                            ))}
                        </View>
                    ) : (
                        <Text className="text-neutral-400 text-sm">
                            Nenhum grupo muscular adicionado ainda
                        </Text>
                    )}

                    {/* Campo: Equipamentos */}
                        <View className="mb-4">
                        <Text className="text-sm font-semibold text-neutral-700 mb-2">
                            Equipamentos
                        </Text>
                        
                        <View className="flex-row gap-2 mb-3">
                            <TextInput
                            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-neutral-900"
                            placeholder="Ex: Halteres, Barra, Banco..."
                            placeholderTextColor="#9CA3AF"
                            value={newEquipment}
                            onChangeText={setNewEquipment}
                            />
                            <TouchableOpacity
                            className="bg-primary-600 rounded-lg px-4 py-3 justify-center"
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
                                className="bg-primary-100 rounded-lg px-3 py-2 flex-row items-center"
                                >
                                <Text className="text-primary-700 text-sm mr-2">
                                    {item}
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => {
                                    setEquipment(equipment.filter((_, i) => i !== index));
                                    }}
                                >
                                    <Text className="text-primary-700 font-bold">×</Text>
                                </TouchableOpacity>
                                </View>
                            ))}
                            </View>
                        ) : (
                            <Text className="text-neutral-400 text-sm">
                            Nenhum equipamento adicionado ainda
                            </Text>
                        )}
                        </View>

                </View>

                                {/* Botão Salvar */}
                <TouchableOpacity
                className="bg-primary-600 rounded-lg py-4 px-6 mt-6"
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