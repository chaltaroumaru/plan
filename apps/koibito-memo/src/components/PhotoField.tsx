import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from './ui';

export default function PhotoField({
  label = '写真',
  uri,
  onChange,
}: {
  label?: string;
  uri: string;
  onChange: (uri: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('権限が必要です', '写真を選ぶには写真ライブラリへのアクセスを許可してください。');
      return;
    }
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets?.[0]?.base64) {
        const asset = result.assets[0];
        const mime = asset.mimeType ?? 'image/jpeg';
        onChange(`data:${mime};base64,${asset.base64}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.placeholder]}>
            <Text style={styles.placeholderText}>📷</Text>
          </View>
        )}
        <View style={styles.btnCol}>
          <Pressable style={styles.btn} onPress={pick} disabled={busy}>
            <Text style={styles.btnText}>{uri ? '写真を変更' : '写真を選ぶ'}</Text>
          </Pressable>
          {uri ? (
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => onChange('')}>
              <Text style={[styles.btnText, styles.btnGhostText]}>削除</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 12, color: COLORS.subtext, marginBottom: 6, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  placeholder: {
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 22 },
  btnCol: { gap: 8 },
  btn: {
    backgroundColor: '#f3e4e8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnGhost: { backgroundColor: 'transparent' },
  btnText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: 12 },
  btnGhostText: { color: COLORS.danger },
});
