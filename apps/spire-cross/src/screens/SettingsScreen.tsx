import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const handleReset = () => {
    Alert.alert(
      'データをリセットしますか?',
      'すべての進行状況(キャラ・カード・ゴールド・交界石など)が削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセットする',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('spire-cross/profile-v2');
            Alert.alert('リセットしました', 'アプリを再起動すると初期状態に戻ります。');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>設定</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリ情報</Text>
          <Text style={styles.infoText}>スパイア・クロス プロトタイプ v2</Text>
          <Text style={styles.infoText}>データはすべて端末内(AsyncStorage)に保存されます。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>
          <Pressable style={styles.dangerBtn} onPress={handleReset}>
            <Text style={styles.dangerBtnText}>進行状況をリセット</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16 },
  section: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 8 },
  infoText: { color: '#9a9ab0', fontSize: 12, marginBottom: 4 },
  dangerBtn: { backgroundColor: '#e8452f', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  dangerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
