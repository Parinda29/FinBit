import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Colors from '../constants/colors';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'large',
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${size}`],
        styles[`button_${variant}`],
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' ? Colors.white : Colors.primary
          }
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            styles[`buttonText_${variant}`],
            styles[`buttonText_${size}`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Size variants
  button_small: {
    height: 40,
    paddingHorizontal: 16,
  },
  button_medium: {
    height: 48,
    paddingHorizontal: 20,
  },
  button_large: {
    height: 56,
    paddingHorizontal: 24,
  },

  // Color variants
  button_primary: {
    backgroundColor: Colors.primary,
  },
  button_secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },

  // Disabled state
  buttonDisabled: {
    opacity: 0.5,
  },

  // Text styling
  buttonText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  buttonText_small: {
    fontSize: 14,
  },
  buttonText_medium: {
    fontSize: 15,
  },
  buttonText_large: {
    fontSize: 16,
  },

  // Text color variants
  buttonText_primary: {
    color: Colors.white,
  },
  buttonText_secondary: {
    color: Colors.primary,
  },
  buttonText_ghost: {
    color: Colors.primary,
  },
});

export default AuthButton;
