import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import Colors, { Radius, Shadows, Space } from '../../constants/colors';

type AppCardProps = ViewProps & {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function AppCard({ children, style, ...rest }: AppCardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Space.md,
    ...Shadows.card,
  },
});
