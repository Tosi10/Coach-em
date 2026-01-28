import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface CelebrationAnimationProps {
  visible: boolean;
  onComplete?: () => void;
}

export function CelebrationAnimation({ visible, onComplete }: CelebrationAnimationProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const confettiAnimations = React.useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Animação do checkmark (escala + fade in)
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animação do confete (partículas caindo)
      confettiAnimations.forEach((confetti, index) => {
        const randomX = (Math.random() - 0.5) * width * 0.8;
        const randomDelay = index * 50;
        const randomDuration = 1500 + Math.random() * 1000;

        Animated.parallel([
          Animated.timing(confetti.translateY, {
            toValue: height + 100,
            duration: randomDuration,
            delay: randomDelay,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.translateX, {
            toValue: randomX,
            duration: randomDuration,
            delay: randomDelay,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.rotate, {
            toValue: Math.random() * 360,
            duration: randomDuration,
            delay: randomDelay,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(randomDelay + randomDuration * 0.7),
            Animated.timing(confetti.opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });

      // Chamar onComplete após animação
      setTimeout(() => {
        onComplete?.();
      }, 2500);
    } else {
      // Resetar animações
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      confettiAnimations.forEach((confetti) => {
        confetti.translateY.setValue(0);
        confetti.translateX.setValue(0);
        confetti.rotate.setValue(0);
        confetti.opacity.setValue(1);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const confettiColors = ['#fb923c', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Confete (partículas coloridas) */}
      {confettiAnimations.map((confetti, index) => {
        const color = confettiColors[index % confettiColors.length];
        const size = 8 + Math.random() * 12;
        const startX = (Math.random() - 0.5) * width * 0.6;

        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: color,
                width: size,
                height: size,
                left: width / 2 + startX,
                transform: [
                  {
                    translateY: confetti.translateY,
                  },
                  {
                    translateX: confetti.translateX,
                  },
                  {
                    rotate: confetti.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: confetti.opacity,
              },
            ]}
          />
        );
      })}

      {/* Checkmark central animado */}
      <Animated.View
        style={[
          styles.checkmarkContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.checkmarkCircle}>
          <FontAwesome name="check" size={64} color="#10b981" />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    top: -50,
    borderRadius: 2,
  },
  checkmarkContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#10b981',
  },
});
