import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';

interface AuthInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: string;
  isPassword?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  editable?: boolean;
  error?: string;
  style?: ViewStyle;
}

const AuthInput: React.FC<AuthInputProps> = ({
  placeholder,
  value,
  onChangeText,
  icon,
  isPassword = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  editable = true,
  error,
  style,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={style}>
      <View
        style={[
          styles.container,
          !editable && styles.disabledContainer,
          focused && styles.focusedContainer,
          error && styles.errorContainer,
        ]}
      >
        {icon && (
          <MaterialIcons
            name={icon as any}
            size={20}
            color={Colors.textSecondary}
            style={styles.icon}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textPlaceholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !isPasswordVisible}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          editable={editable}
          selectionColor={Colors.primary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isPasswordVisible ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <ErrorText text={error} />}
    </View>
  );
};

interface ErrorTextProps {
  text: string;
}

const ErrorText: React.FC<ErrorTextProps> = ({ text }) => (
  <Text style={styles.errorText}>{text}</Text>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  focusedContainer: {
    borderColor: Colors.primary,
    backgroundColor: '#FAF8FF',
  },
  disabledContainer: {
    backgroundColor: Colors.surface,
    opacity: 0.6,
  },
  errorContainer: {
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
    paddingVertical: 12,
  },
  passwordToggle: {
    padding: 8,
    marginRight: -8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  errorTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  errorIcon: {
    marginRight: 4,
  },
});

export default AuthInput;
