import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase();

  let bg = Colors.infoLight;
  let text = Colors.info;

  if (norm.includes('DELIVERED') || norm.includes('TERKIRIM') || norm.includes('SELESAI') || norm.includes('DITERIMA')) {
    bg = Colors.successLight;
    text = Colors.success;
  } else if (norm.includes('BATAL') || norm.includes('CANCEL') || norm.includes('HILANG')) {
    bg = Colors.dangerLight;
    text = Colors.danger;
  } else if (norm.includes('PENDING') || norm.includes('MENUNGGU') || norm.includes('HOLD')) {
    bg = Colors.warningLight;
    text = Colors.warning;
  } else if (norm.includes('PROCESS') || norm.includes('TRANSIT') || norm.includes('MANIFEST') || norm.includes('KIRIM')) {
    bg = Colors.accentLight;
    text = Colors.accent;
  }

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      <Text style={[styles.badgeText, { color: text }, isSmall && styles.badgeTextSm]}>
        {norm || 'MENUNGGU'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  badgeTextSm: {
    fontSize: 10,
    fontWeight: '700',
  },
});
