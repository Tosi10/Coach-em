/**
 * TELA INICIAL - Versão Simplificada para Aprendizado
 * 
 * Esta é a tela mais simples possível para você entender os conceitos básicos.
 * Vamos explicar TUDO linha por linha!
 */

import { UserType } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';


/**
 * O QUE É ISSO?
 * 
 * Esta é uma FUNÇÃO que retorna uma TELA (componente).
 * No React Native, cada tela é uma função que retorna elementos visuais.
 */
export default function HomeScreen() {

  
  const [userType, setUserType] = useState<UserType | null>(null);

  const mockAthletes = [
    { id: '1', name: 'João Silva', sport: 'Futebol', status: 'Ativo'},
    { id: '2', name: 'Maria Oliveira', sport: 'Vôlei', status: 'Ativo'},
    { id: '3', name: 'Pedro Santos', sport: 'Basquete', status: 'Ativo'},
    { id: '4', name: 'Ana Souza', sport: 'Atletismo', status: 'Ativo'},
    { id: '5', name: 'Carlos Ferreira', sport: 'Futebol', status: 'Ativo'},
    { id: '6', name: 'Laura Rodrigues', sport: 'Vôlei', status: 'Ativo'},
    { id: '7', name: 'Rafael Oliveira', sport: 'Basquete', status: 'Ativo'},
    { id: '8', name: 'Camila Silva', sport: 'Atletismo', status: 'Ativo'},
  ]
  

  useEffect(() => {
    const loadUserType = async () => {
      const savedType = await AsyncStorage.getItem('userType');
      if (savedType) {
        setUserType(savedType as UserType);
      }
    };
    loadUserType();
  }, []);
  
  return (
    <View className="flex-1 bg-white px-6 pt-12">
      {/* 
        EXPLICAÇÃO DAS CLASSES (NativeWind/Tailwind):
        - flex-1 = Ocupa todo o espaço disponível
        - items-center = Centraliza os itens horizontalmente
        - justify-center = Centraliza os itens verticalmente
        - bg-white = Fundo branco
      */}
      
      <Text className="text-4xl font-bold text-neutral-900 mb-4">
        Coach'em
      </Text>
      {/* 
        EXPLICAÇÃO DAS CLASSES:
        - text-4xl = Tamanho de texto grande
        - font-bold = Texto em negrito
        - text-neutral-900 = Cor do texto (cinza escuro)
        - mb-4 = Margem inferior (espaço abaixo)
      */}

      <Text className="text-neutral-600 text-center mb-8 px-4">
        Bem-vindo ao seu app de gestão esportiva!
      </Text>

      {userType && (
        <Text className="text-xl font-semibold text-primary-600 mb-4">
          Você está logado como: {userType === UserType.COACH ? 'Treinador' : 'Atleta'}

        </Text>
      )}

      {userType === UserType.COACH ? (
        //Dashboard do Treinador
        <View className="w-full mt-8">
          <Text className="text-2xl font-bold text-neutral-900 mb-6">
            Dashboard do Treinador
          </Text>
          <Text className="text-neutral-600 mb-6">
            Gerencie seus atletas e crie treinos personalizados.
          </Text>

          <View className="flex-col gap-4 mb-6">
            <TouchableOpacity className="bg-primary-600 rounded-lg py-4 px-6"
             onPress={() => Alert.alert('Biblioteca de Exercícios', 'Em breve você poredá gerenciar seus exercícios aqui!')}
             >
              <Text className="text-white font-semibold text-center text-lg">
               Biblioteca de Exercícios
              </Text>
            </TouchableOpacity>



            <TouchableOpacity className="bg-primary-600 rounded-lg py-4 px-6"
             onPress={() => Alert.alert('Criar Treino', 'Em breve você poderá criar seus treinos aqui!')}
             >
              <Text className="text-white font-semibold text-center text-lg">
               Criar Treino

              </Text>
             </TouchableOpacity>
          </View>

          <View className="w-full mt-6">
            <Text className="text-xl font-bold text-neutral-900 mb-4">
              Meus Atletas ({mockAthletes.length})
            </Text>

            {mockAthletes.map((athlete) => (
              <View key={athlete.id} className="bg-neutral-50 rounded-lg p-4 mb-3 border border-neutral-200">
                <Text className="text-lg font-semibold text-neutral-900">
                  {athlete.name}
                </Text>
                <Text className="text-neutral-600 mt-1">
                  {athlete.sport}* {athlete.status}
                </Text>
              </View>
            ))}

          </View>

        </View>
      ) : userType === UserType.ATHLETE ? (
        //Dashboard do Atleta
        <View className="w-full mt-8">
          <Text className="text-2xl font-bold text-neutral-900 mb-6">
            Dashboard do Atleta
          </Text>
          <Text className="text-neutral-600 mb-6">
            Veja seus treinos atribuidos e acompanhe seu progresso.
          </Text>
        </View>
      
      ) : null}

    </View>
  );
}

/**
 * RESUMO DO QUE VOCÊ VIU:
 * 
 * 1. View = Container (caixa)
 * 2. Text = Texto
 * 3. TouchableOpacity = Botão
 * 4. className = Estilização com NativeWind/Tailwind (classes CSS)
 * 5. onPress = Ação quando clica
 * 
 * PRÓXIMO PASSO: Vamos adicionar ESTADO para mudar algo quando clicar!
 */
