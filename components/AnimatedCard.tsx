import React from 'react';
import { Animated, ViewStyle, Pressable } from 'react-native';
import { createCardElevationAnimation } from '../utils/animations';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  onPress?: () => void;
}

/**
 * Card with elevation + shadow animation on press
 * Subtle premium feedback
 */
const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  containerStyle,
  onPress,
}) => {
  const { elevation, onPressIn, onPressOut, shadowStyle } = createCardElevationAnimation();

  return (
    <Animated.View
      style={[
        {
          borderRadius: 16,
          overflow: 'hidden',
        },
        shadowStyle,
        containerStyle,
      ]}
    >
      <Animated.View
        style={[
          {
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 12,
            elevation: elevation,
          },
          style,
        ]}
      >
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
        >
          <Animated.View>
            {children}
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

export default AnimatedCard;
