import React from 'react';
import {
  Animated,
  TouchableOpacity,
  ViewStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { createPressAnimation } from '../utils/animations';

interface AnimatedButtonProps extends Omit<TouchableOpacityProps, 'onPressIn' | 'onPressOut'> {
  children: React.ReactNode;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

/**
 * Button with press animation (scale 1 → 0.96 with spring back)
 * Premium fintech feel
 */
const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  style,
  containerStyle,
  onPress,
  ...props
}) => {
  const { scaleAnim, onPressIn, onPressOut } = createPressAnimation();

  const handlePressIn = () => {
    onPressIn();
  };

  const handlePressOut = () => {
    onPressOut();
  };

  return (
    <View style={containerStyle}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          {...props}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={style}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default AnimatedButton;
