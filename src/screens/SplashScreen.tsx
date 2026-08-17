import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../storage/LanguageContext';

function LoadingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [delay, opacity]);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

// The app's boot splash — shown while persisted state (language, groups,
// expenses) loads from AsyncStorage. App.tsx keeps this mounted for a
// minimum duration so the wordmark below has time to reflect the user's
// saved language rather than flashing the 'en' default and vanishing.
export default function SplashScreen() {
  const { t } = useLanguage();
  const halo = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    Animated.timing(rise, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [halo, rise]);

  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.8] });
  const riseOpacity = rise;
  const riseTranslateY = rise.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <View style={styles.safe}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <View style={styles.center}>
        <View style={styles.markWrap}>
          <Animated.View
            style={[
              styles.halo,
              { opacity: haloOpacity, transform: [{ scale: haloScale }] },
            ]}
          />
          <View style={styles.ring} />
          <View style={styles.markTile}>
            <Ionicons name="briefcase-outline" size={52} color="#6D28D9" />
          </View>
        </View>

        <Animated.View
          style={[
            styles.textBlock,
            { opacity: riseOpacity, transform: [{ translateY: riseTranslateY }] },
          ]}
        >
          <Text style={styles.title}>{t.splash.title}</Text>
          <Text style={styles.tagline}>{t.splash.tagline}</Text>
        </Animated.View>
      </View>

      <View style={styles.dots}>
        <LoadingDot delay={0} />
        <LoadingDot delay={200} />
        <LoadingDot delay={400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#4C1D95',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: { position: 'absolute', borderRadius: 999 },
  glowTop: {
    width: 620,
    height: 620,
    top: -260,
    left: -220,
    backgroundColor: 'rgba(167,139,250,0.16)',
  },
  glowBottom: {
    width: 520,
    height: 520,
    bottom: -260,
    right: -200,
    backgroundColor: 'rgba(109,40,217,0.2)',
  },
  center: { alignItems: 'center', gap: 30 },
  markWrap: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  ring: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  markTile: {
    width: 112,
    height: 112,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0C0420',
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  textBlock: { alignItems: 'center', gap: 9 },
  title: { fontSize: 27, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.62)', letterSpacing: 0.2 },
  dots: {
    position: 'absolute',
    bottom: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#FFFFFF' },
});
