import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Colors, { Radius } from '../../constants/colors';

type AppInputProps = TextInputProps & {
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export default function AppInput({ icon, style, ...props }: AppInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, focused && styles.focused]}>
      {icon ? <MaterialIcons name={icon} size={18} color={focused ? Colors.primary : Colors.textTertiary} /> : null}
      <TextInput
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={Colors.textTertiary}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: '#FAF8FF',
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
  },
});
