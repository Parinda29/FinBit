import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import Colors, { Radius } from '../../constants/colors';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
};

export default function AppButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: AppButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={[styles.button, styles[variant], (disabled || loading) && styles.disabled, style]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'secondary' ? Colors.primary : Colors.white} />
        ) : (
          <Text style={[styles.text, styles[`text_${variant}`]]}>{title}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.accentPurple,
  },
  danger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 15,
    fontWeight: '800',
  },
  text_primary: {
    color: Colors.white,
  },
  text_secondary: {
    color: Colors.primaryDark,
  },
  text_danger: {
    color: Colors.error,
  },
});
