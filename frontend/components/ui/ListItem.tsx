import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors, { Radius } from '../../constants/colors';

type ListItemProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

export default function ListItem({ icon, title, subtitle, onPress }: ListItemProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.row} activeOpacity={0.85}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon} size={18} color={Colors.primaryDark} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 58,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
