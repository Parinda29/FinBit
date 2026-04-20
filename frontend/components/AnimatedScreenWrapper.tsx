import React, { useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { createScreenEntranceAnimation } from '../utils/animations';

interface AnimatedScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
}

/**
 * Wraps screen content with smooth entrance animation
 * Fade in + slight upward slide
 */
const AnimatedScreenWrapper: React.FC<AnimatedScreenWrapperProps> = ({
  children,
  style,
  duration = 300,
}) => {
  const { animate, animatedStyle } = createScreenEntranceAnimation(duration);

  useEffect(() => {
    animate();
  }, [animate]);

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          ...animatedStyle,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedScreenWrapper;
