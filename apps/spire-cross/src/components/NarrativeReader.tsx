import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * 戦闘の前後に本文を読ませる、ビジュアルノベル風の全画面リーダー。
 * ソシャゲの周回コンテンツの合間に、小説の一節を挟む体験を作るための共通部品。
 */
export default function NarrativeReader({
  chapterLabel,
  title,
  body,
  continueLabel,
  onContinue,
}: {
  chapterLabel: string;
  title: string;
  body: string;
  continueLabel: string;
  onContinue: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    fade.setValue(0);
    rise.setValue(14);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]).start();
  }, [body]);

  const paragraphs = body.split('\n\n');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.veil} />
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
          <Text style={styles.chapterLabel}>{chapterLabel}</Text>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.divider} />
          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </Animated.View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>{continueLabel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  veil: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(6,4,16,0.72)' },
  container: { padding: 24, paddingTop: 32, paddingBottom: 16 },
  chapterLabel: {
    color: '#c9b8ff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: { color: '#ffd76a', fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: 'rgba(255,215,106,0.5)',
    alignSelf: 'center',
    marginVertical: 18,
    borderRadius: 1,
  },
  paragraph: {
    color: '#e8e4f5',
    fontSize: 15,
    lineHeight: 27,
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  footer: { padding: 20, paddingTop: 8 },
  continueBtn: {
    backgroundColor: 'rgba(124,92,255,0.85)',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,106,0.4)',
  },
  continueBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
