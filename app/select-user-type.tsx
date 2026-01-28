import { UserType } from "@/src/types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from '@/src/contexts/ThemeContext';
import { getThemeStyles } from '@/src/utils/themeStyles';



export default function SelectUserTypeScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const themeStyles = getThemeStyles(theme.colors);
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
        <View className="flex-1 items-center justify-center px-6" style={themeStyles.bg}>
            <Text className="text-3xl font-bold mb-8" style={themeStyles.text}>
                Escolha seu perfil
            </Text>
            
            <View className="flex-row gap-4 w-full">
                <TouchableOpacity 
                  className="flex-1 py-6 px-4 rounded-xl border-2"
                  style={{
                    borderColor: selectedType === UserType.COACH 
                      ? theme.colors.primary 
                      : theme.colors.border,
                    backgroundColor: selectedType === UserType.COACH 
                      ? (theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20')
                      : theme.colors.card,
                    ...(selectedType === UserType.COACH ? {
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    } : {}),
                  }}
                  onPress={() => handleSelectType(UserType.COACH)}
                >
                  <Text className="text-center font-semibold text-lg" style={{
                    color: selectedType === UserType.COACH
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }}>
                        Treinador
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className="flex-1 py-6 px-4 rounded-xl border-2"
                  style={{
                    borderColor: selectedType === UserType.ATHLETE 
                      ? theme.colors.primary 
                      : theme.colors.border,
                    backgroundColor: selectedType === UserType.ATHLETE 
                      ? (theme.mode === 'dark' ? theme.colors.primary + '30' : theme.colors.primary + '20')
                      : theme.colors.card,
                    ...(selectedType === UserType.ATHLETE ? {
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    } : {}),
                  }}
                  onPress={() => handleSelectType(UserType.ATHLETE)}
                >
                    <Text className="text-center font-semibold text-lg" style={{
                      color: selectedType === UserType.ATHLETE
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }}>
                        Atleta
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}