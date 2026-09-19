import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';

const CIRCLE_IMAGE_ASPECT_RATIO = 1674 / 940;

/**
 * ホーム広場に置かれた、ガチャへの入り口となる魔法陣。
 * 遠近感のある楕円イラストのため回転させると歪んで見えてしまうので、
 * 向きは保ったまま呼吸のような拡縮+発光の明滅でアニメーションさせる。
 */
export default function AnimatedMagicCircle({
  areaWidth,
  areaHeight,
  onPress,
}: {
  areaWidth: number;
  areaHeight: number;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.035] });

  const circleWidth = areaWidth * 0.66;
  const circleHeight = circleWidth / CIRCLE_IMAGE_ASPECT_RATIO;
  const left = areaWidth * 0.5 - circleWidth / 2;
  const top = areaHeight * 0.895 - circleHeight / 2;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={{ position: 'absolute', left, top, width: circleWidth, height: circleHeight }}
    >
      <Animated.Image
        source={require('../../assets/ui/magic_circle.png')}
        style={{
          width: circleWidth,
          height: circleHeight,
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
        resizeMode="contain"
      />
      <Text style={styles.label} pointerEvents="none">
        ガチャへ
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    alignSelf: 'center',
    top: '42%',
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: 'rgba(10,8,24,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
});
