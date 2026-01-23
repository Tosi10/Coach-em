import { UserType } from "@/src/types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";



export default function SelectUserTypeScreen() {
    const router = useRouter();
    const[selectedType, setSelectedType] = useState<UserType | null>(null);

    const handleSelectType = async (type: UserType) => {
        console.log('Tipo selecionado:', type)
        setSelectedType(type);
        await AsyncStorage.setItem('userType', type);
        
        // Se for Atleta, salvar o ID do Pedro Santos como atleta logado
        if (type === UserType.ATHLETE) {
            await AsyncStorage.setItem('currentAthleteId', '3'); // Pedro Santos
        }
        
        router.push('/(tabs)');
    }

    return (
        <View className="flex-1 items-center justify-center bg-dark-950 px-6">
            <Text className="text-3xl font-bold text-white mb-8">
                Escolha seu perfil
            </Text>
            
            <View className="flex-row gap-4 w-full">
                <TouchableOpacity className={`flex-1 py-6 px-4 rounded-xl border-2 ${
                    selectedType === UserType.COACH
                    ? 'border-primary-500 bg-primary-500/20'
                    : 'border-dark-700 bg-dark-900'
                  }`}
                  style={selectedType === UserType.COACH ? {
                    shadowColor: '#fb923c',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  } : {}}
                  onPress={() => handleSelectType(UserType.COACH)}
                >
                  <Text className={`text-center font-semibold text-lg ${
                        selectedType === UserType.COACH
                        ? 'text-primary-400'
                        : 'text-neutral-300'
                    }`}>
                        Treinador
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className={`flex-1 py-6 px-4 rounded-xl border-2 ${
                    selectedType === UserType.ATHLETE
                    ? 'border-primary-500 bg-primary-500/20'
                    : 'border-dark-700 bg-dark-900'
                }`}
                style={selectedType === UserType.ATHLETE ? {
                  shadowColor: '#fb923c',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                } : {}}
                onPress={() => handleSelectType(UserType.ATHLETE)}
                >
                    <Text className={`text-center font-semibold text-lg ${
                        selectedType === UserType.ATHLETE
                        ? 'text-primary-400'
                        : 'text-neutral-300'
                    }`}>
                        Atleta
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}