import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';

import { useTheme } from '@/src/contexts/ThemeContext';
import { UserType } from '@/src/types';
import { getThemeStyles } from '@/src/utils/themeStyles';

type OnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
  userType: UserType | null;
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onClose,
  userType,
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme.colors);
  const [step, setStep] = useState(0);

  const isCoach = userType === UserType.COACH;

  const steps = [
    {
      title: 'Home',
      description: isCoach
        ? 'Aqui você enxerga o panorama semanal, treinos ativos hoje, pendentes e concluídos. É o seu painel principal como treinador.'
        : 'Aqui você vê um resumo dos seus treinos, progresso e o treino do dia em destaque.',
    },
    {
      title: isCoach ? 'Atletas' : 'Treinos',
      description: isCoach
        ? 'Na aba Atletas você acompanha a lista de atletas, acessa detalhes individuais e o histórico de treinos de cada um.'
        : 'Na aba Treinos você encontra a lista de treinos atribuídos a você e pode revisar o que já fez.',
    },
    {
      title: 'Perfil',
      description:
        'No Perfil você pode sair da conta, mudar o tema claro/escuro e, futuramente, gerenciar mais configurações da sua conta.',
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      >
        <View
          className="w-full rounded-2xl p-5"
          style={[
            themeStyles.card,
            {
              maxHeight: '80%',
            },
          ]}
        >
          <Text className="text-center text-xl font-bold mb-2" style={themeStyles.text}>
            Bem-vindo ao Treina+
          </Text>
          <Text className="text-center text-xs mb-4" style={themeStyles.textSecondary}>
            Um tour rápido para você entender onde estão as coisas principais do app.
          </Text>

          <View
            className="self-center mb-4 px-3 py-1 rounded-full"
            style={{ backgroundColor: theme.colors.primary + '22' }}
          >
            <Text className="text-xs font-semibold" style={{ color: theme.colors.primary }}>
              Passo {step + 1} de {steps.length}
            </Text>
          </View>

          <ScrollView
            className="mb-4"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-lg font-semibold mb-2" style={themeStyles.text}>
              {current.title}
            </Text>
            <Text className="text-sm leading-5" style={themeStyles.textSecondary}>
              {current.description}
            </Text>
          </ScrollView>

          <View className="flex-row justify-between items-center mt-2">
            <TouchableOpacity
              disabled={step === 0}
              onPress={() => setStep((prev) => Math.max(0, prev - 1))}
              className="px-3 py-2 rounded-lg"
              style={{
                opacity: step === 0 ? 0.4 : 1,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <Text className="text-xs" style={themeStyles.text}>
                Voltar
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-1">
              {steps.map((_, index) => (
                <View
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      index === step ? theme.colors.primary : theme.colors.border,
                  }}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                if (!isLast) {
                  setStep((prev) => Math.min(steps.length - 1, prev + 1));
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Text className="text-xs font-semibold text-black">
                {isLast ? 'Começar a usar' : 'Próximo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

