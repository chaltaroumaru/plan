import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, PrimaryButton } from './ui';

export default function FormModal({
  visible,
  title,
  onClose,
  onSubmit,
  submitLabel = '保存する',
  showDelete,
  onDelete,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  showDelete?: boolean;
  onDelete?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <View style={styles.footer}>
            {showDelete && onDelete ? (
              <View style={styles.deleteWrap}>
                <PrimaryButton title="削除する" variant="danger" onPress={onDelete} />
              </View>
            ) : null}
            <PrimaryButton title={submitLabel} onPress={onSubmit} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(61,43,50,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  closeIcon: { fontSize: 18, color: COLORS.subtext, padding: 4 },
  body: { marginBottom: 8 },
  footer: { gap: 8 },
  deleteWrap: { marginBottom: 4 },
});
