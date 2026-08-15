import React, { useEffect, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface Props {
  onComplete: () => void;
}

const COIN_COUNT = 16;
const EMOJIS = ['🪙', '🪙', '🪙', '💰'];

interface CoinConfig {
  emoji: string;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
}

function buildCoins(): CoinConfig[] {
  return Array.from({ length: COIN_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / COIN_COUNT + (Math.random() - 0.5) * 0.5;
    const distance = 90 + Math.random() * 150;
    return {
      emoji: EMOJIS[i % EMOJIS.length],
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance * 0.6 - 30,
      size: 22 + Math.random() * 16,
      delay: Math.random() * 140,
      duration: 700 + Math.random() * 350,
      rotation: (Math.random() - 0.5) * 720,
    };
  });
}

// Fires a one-shot burst of coins flying outward from the center and fading
// away, then calls onComplete. Mount this component to play it; unmount (or
// let it call onComplete) when done — it does not replay on its own.
export default function CoinBurst({ onComplete }: Props) {
  const coins = useMemo(buildCoins, []);
  const progress = useMemo(() => coins.map(() => new Animated.Value(0)), [coins]);

  useEffect(() => {
    const animations = progress.map((value, i) =>
      Animated.timing(value, {
        toValue: 1,
        duration: coins[i].duration,
        delay: coins[i].delay,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
    const maxEnd = Math.max(...coins.map((c) => c.delay + c.duration));
    const timer = setTimeout(onComplete, maxEnd + 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {coins.map((coin, i) => {
        const translateX = progress[i].interpolate({ inputRange: [0, 1], outputRange: [0, coin.dx] });
        const translateY = progress[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, coin.dy + 90],
        });
        const opacity = progress[i].interpolate({
          inputRange: [0, 0.65, 1],
          outputRange: [1, 1, 0],
        });
        const scale = progress[i].interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0.4, 1, 0.7],
        });
        const rotate = progress[i].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${coin.rotation}deg`],
        });
        return (
          <Animated.Text
            key={i}
            style={[
              styles.coin,
              {
                fontSize: coin.size,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }, { scale }],
              },
            ]}
          >
            {coin.emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  coin: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    marginLeft: -14,
    marginTop: -14,
  },
});
