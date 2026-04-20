import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

type FinbitLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  compact?: boolean;
};

const SIZE_MAP = {
  sm: {
    mark: 34,
    radius: 10,
    icon: 16,
    title: 13,
    subtitle: 10,
  },
  md: {
    mark: 48,
    radius: 14,
    icon: 22,
    title: 17,
    subtitle: 11,
  },
  lg: {
    mark: 58,
    radius: 16,
    icon: 26,
    title: 20,
    subtitle: 12,
  },
} as const;

export default function FinbitLogo({ size = 'md', showTagline = true, compact = false }: FinbitLogoProps) {
  const token = SIZE_MAP[size];

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View
        style={[
          styles.mark,
          {
            width: token.mark,
            height: token.mark,
            borderRadius: token.radius,
          },
        ]}
      >
        <View style={styles.glowCircle} />
        <MaterialIcons name="account-balance-wallet" size={token.icon} color={Colors.white} />
      </View>

      <View style={styles.copyWrap}>
        <Text style={[styles.title, { fontSize: token.title }]}>FinBit</Text>
        {showTagline && <Text style={[styles.subtitle, { fontSize: token.subtitle }]}>Smart Finance Tracker</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCompact: {
    alignSelf: 'flex-start',
  },
  mark: {
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    right: -6,
    top: -6,
    backgroundColor: 'rgba(237,233,254,0.65)',
  },
  copyWrap: {
    marginLeft: 10,
  },
  title: {
    color: '#1F1147',
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 1,
    fontWeight: '600',
  },
});
