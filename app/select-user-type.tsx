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
        <View className="flex-1 items-center justify-center bg-white px-6">
            <Text className="text-3xl font-bold text-neutral-900 mb-8">
                Escolha seu perfil
            </Text>
            
            <View className="flex-row gap-4 w-full">
                <TouchableOpacity className={`flex-1 py-6 px-4 rounded-lg border-2 ${
                    selectedType === UserType.COACH
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-neutral-200 bg-neutral-50'
                  }`}
                  onPress={() => handleSelectType(UserType.COACH)}
                >
                  <Text className={`text-center font-semibold text-lg ${
                        selectedType === UserType.COACH
                        ? 'text-primary-600'
                        : 'text-neutral-600'
                    }`}>
                        Treinador
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className={`flex-1 py-6 px-4 rounded-lg border-2 ${
                    selectedType === UserType.ATHLETE
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
                onPress={() => handleSelectType(UserType.ATHLETE)}
                >
                    <Text className={`text-center font-semibold text-lg ${
                        selectedType === UserType.ATHLETE
                        ? 'text-primary-600'
                        : 'text-neutral-600'
                    }`}>
                        Atleta
                    </Text>

                </TouchableOpacity>

                

            </View>
        </View>
    );
}