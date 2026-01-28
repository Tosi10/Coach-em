import { EmptyState } from '@/components/EmptyState';
import { useToastContext } from '@/components/ToastProvider';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const mockAthletes = [
  { id: '1', name: 'João Silva', sport: 'Futebol', status: 'Ativo'},
  { id: '2', name: 'Maria Oliveira', sport: 'Vôlei', status: 'Ativo'},
  { id: '3', name: 'Pedro Santos', sport: 'Basquete', status: 'Ativo'},
  { id: '4', name: 'Ana Souza', sport: 'Atletismo', status: 'Ativo'},
  { id: '5', name: 'Carlos Ferreira', sport: 'Futebol', status: 'Ativo'},
  { id: '6', name: 'Laura Rodrigues', sport: 'Vôlei', status: 'Ativo'},
  { id: '7', name: 'Rafael Oliveira', sport: 'Basquete', status: 'Ativo'},
  { id: '8', name: 'Camila Silva', sport: 'Atletismo', status: 'Ativo'},
];

export default function TabTwoScreen() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Lista de atletas atualizada!', 'success');
    } catch (error) {
      showToast('Erro ao atualizar', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  return (
    <ScrollView 
      className="flex-1 bg-dark-950"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fb923c"
          colors={['#fb923c']}
        />
      }
    >
      <View className="px-6 pt-12 pb-20">
        {/* Título */}
        <Text className="text-3xl font-bold text-white mb-2">
          Meus Atletas
        </Text>
        <Text className="text-neutral-400 mb-6">
          Gerencie seus atletas e atribua treinos personalizados
        </Text>

        {/* Contador */}
        <Text className="text-xl font-bold text-white mb-4">
          Total: {mockAthletes.length} atleta{mockAthletes.length !== 1 ? 's' : ''}
        </Text>

        {/* Lista de atletas */}
        {mockAthletes.length === 0 ? (
          <EmptyState
            icon="users"
            message="Você ainda não tem atletas cadastrados."
            actionLabel="Adicionar Atleta"
            onAction={() => {
              // TODO: Implementar navegação para adicionar atleta
              showToast('Funcionalidade em desenvolvimento', 'info');
            }}
          />
        ) : (
          mockAthletes.map((athlete) => (
          <TouchableOpacity
            key={athlete.id}
            className="bg-dark-900 rounded-xl p-4 mb-3 border border-dark-700"
            style={{
              shadowColor: '#fb923c',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}
            onPress={() => {
              router.push({
                pathname: '/athlete-profile',
                params: { athleteId: athlete.id },
              });
            }}
          >
            <Text className="text-lg font-semibold text-white">
              {athlete.name}
            </Text>
            <Text className="text-neutral-400 mt-1">
              {athlete.status}
            </Text>
          </TouchableOpacity>
        ))
        )}
      </View>
    </ScrollView>
  );
}
