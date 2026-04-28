import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import { StyleProp, ViewStyle } from 'react-native';

type AppVideoPlayerProps = {
  source: VideoSource;
  style?: StyleProp<ViewStyle>;
  nativeControls?: boolean;
  shouldPlay?: boolean;
  isLooping?: boolean;
  isMuted?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
};

export function AppVideoPlayer({
  source,
  style,
  nativeControls = true,
  shouldPlay = false,
  isLooping = false,
  isMuted = false,
  contentFit = 'contain',
}: AppVideoPlayerProps) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = isLooping;
    instance.muted = isMuted;
    if (shouldPlay) {
      instance.play();
    }
  });

  return (
    <VideoView
      player={player}
      style={style}
      nativeControls={nativeControls}
      contentFit={contentFit}
    />
  );
}
