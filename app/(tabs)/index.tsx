/**
 * TELA INICIAL - Versão Simplificada para Aprendizado
 * 
 * Esta é a tela mais simples possível para você entender os conceitos básicos.
 * Vamos explicar TUDO linha por linha!
 */

import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * O QUE É ISSO?
 * 
 * Esta é uma FUNÇÃO que retorna uma TELA (componente).
 * No React Native, cada tela é uma função que retorna elementos visuais.
 */
export default function HomeScreen() {

  const [contador, setContador] = useState(0);

  const aumentar = () => {
    setContador(contador + 1);
  };
  const diminuir = () => {
    setContador(contador - 1);
  };
  
  useEffect(() => {
    console.log('Contador mudar para:', contador);
    alert(`Contador mudou para: ${contador}`);
  }, [contador]);
  
  return (
    <View className="flex-1 items-center justify-center bg-white">
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

      <Text className="text-6xl font-bold text-primary-600 mb-8">
        {contador}
      </Text>
      {/* 
        EXPLICAÇÃO DAS CLASSES:
        - text-neutral-600 = Cor do texto (cinza médio)
        - text-center = Texto centralizado
        - mb-8 = Margem inferior maior
        - px-4 = Padding horizontal (espaço nas laterais)
      */}

      <View className="flex-row gap-4">
        <TouchableOpacity className="bg-red-500 rounded-lg px-8 py-4"
           onPress={diminuir}
        >
          <Text className="text-white font-bold text-2xl">
            -
          </Text>

        </TouchableOpacity>

        <TouchableOpacity className="bg-green-500 rounded-lg px-8 py-4"
          onPress={aumentar}
        >
          <Text className="text-white font-bold text-2xl">
            +
          </Text>
        </TouchableOpacity>

      </View>
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
