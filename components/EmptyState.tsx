import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Image, type ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';

interface EmptyStateProps {
  icon?: keyof typeof FontAwesome.glyphMap;
  /** Se definido, mostra PNG em vez do ícone FontAwesome. */
  imageSource?: ImageSourcePropType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
}

export function EmptyState({ 
  icon = 'inbox',
  imageSource,
  message, 
  actionLabel,
  onAction,
  iconColor = '#737373'
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12 px-4">
      {imageSource ? (
        <Image
          source={imageSource}
          style={{ width: 120, height: 120, marginBottom: 16 }}
          resizeMode="contain"
        />
      ) : (
        <FontAwesome 
          name={icon} 
          size={64} 
          color={iconColor} 
          style={{ marginBottom: 16, opacity: 0.5 }}
        />
      )}
      <Text className="text-neutral-400 text-center text-base mb-2 px-4">
        {message}
      </Text>
      {onAction && actionLabel && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-4 bg-orange-500 px-6 py-3 rounded-lg"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
