import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../storage/LanguageContext';
import { useReducedMotion } from '../utils/useReducedMotion';

const WORLD_CAPITALS_COLLAGE = require('../../assets/world-capitals-collage.png');
const LOGO_WORDMARK = require('../../assets/splash-logo-wordmark.png');
const LOGO_ASPECT_RATIO = 919 / 458;

function TaglineLine({
  text,
  delay,
  reduceMotion,
}: {
  text: string;
  delay: number;
  reduceMotion: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, opacity, translateY, reduceMotion]);

  return (
    <Animated.Text style={[styles.tagline, { opacity, transform: [{ translateY }] }]}>
      {text}
    </Animated.Text>
  );
}

function LoadingDot({ delay, reduceMotion }: { delay: number; reduceMotion: boolean }) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
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
  }, [delay, opacity, reduceMotion]);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

// The app's boot splash — shown while persisted state (language, vacations,
// expenses) loads from AsyncStorage. App.tsx keeps this mounted for a
// minimum duration so the wordmark below has time to reflect the user's
// saved language rather than flashing the 'en' default and vanishing.
export default function SplashScreen() {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      rise.setValue(1);
      return;
    }
    Animated.timing(rise, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [rise, reduceMotion]);

  const riseOpacity = rise;
  const riseTranslateY = rise.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Image
        source={WORLD_CAPITALS_COLLAGE}
        style={styles.backgroundImage}
        contentFit="cover"
        accessible={false}
      />
      <View style={styles.backgroundWash} accessible={false} />
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <View style={styles.center} accessibilityRole="header">
        <Animated.View
          style={[
            styles.textBlock,
            { opacity: riseOpacity, transform: [{ translateY: riseTranslateY }] },
          ]}
        >
          <Image
            source={LOGO_WORDMARK}
            style={styles.logo}
            contentFit="contain"
            accessible
            accessibilityLabel={t.splash.title}
          />
          <View style={styles.taglineBlock}>
            <TaglineLine text={t.splash.taglineLines[0]} delay={1000} reduceMotion={reduceMotion} />
            <TaglineLine text={t.splash.taglineLines[1]} delay={2000} reduceMotion={reduceMotion} />
            <TaglineLine text={t.splash.taglineLines[2]} delay={3000} reduceMotion={reduceMotion} />
          </View>
        </Animated.View>
      </View>

      <View
        style={styles.dots}
        accessibilityRole="progressbar"
        accessibilityLabel={t.rates.loading}
      >
        <LoadingDot delay={0} reduceMotion={reduceMotion} />
        <LoadingDot delay={200} reduceMotion={reduceMotion} />
        <LoadingDot delay={400} reduceMotion={reduceMotion} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backgroundImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  backgroundWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 24, 27, 0.58)',
  },
  glow: { position: 'absolute', borderRadius: 999 },
  glowTop: {
    width: 620,
    height: 620,
    top: -260,
    left: -220,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glowBottom: {
    width: 520,
    height: 520,
    bottom: -260,
    right: -200,
    backgroundColor: 'rgba(161,161,170,0.12)',
  },
  center: { alignItems: 'center' },
  textBlock: { alignItems: 'center', gap: 9 },
  logo: { width: 220, height: 220 / LOGO_ASPECT_RATIO },
  taglineBlock: { alignItems: 'center', gap: 6 },
  tagline: {
    fontSize: 22,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 0.2,
  },
  dots: {
    position: 'absolute',
    bottom: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#FFFFFF' },
});
