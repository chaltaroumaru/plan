import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from './ui';

export default function ItemCard({
  title,
  subtitle,
  detail,
  badge,
  badgeColor,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  detail?: string;
  badge?: string;
  badgeColor?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable style={styles.mainArea} onPress={onEdit}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: badgeColor ?? COLORS.accent }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {detail ? (
          <Text style={styles.detail} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </Pressable>
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={onEdit}>
          <Text style={styles.actionText}>✏️</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onDelete}>
          <Text style={styles.actionText}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  mainArea: { flex: 1, padding: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  subtitle: { fontSize: 12, color: COLORS.primaryDark, marginTop: 3, fontWeight: '600' },
  detail: { fontSize: 12, color: COLORS.subtext, marginTop: 4 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  actions: { justifyContent: 'center', paddingHorizontal: 10, gap: 10 },
  actionBtn: { padding: 4 },
  actionText: { fontSize: 16 },
});
