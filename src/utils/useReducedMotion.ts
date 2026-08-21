import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Mirrors the platform Reduce Motion preference and updates while the app is open. */
export function useReducedMotion(): boolean {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotionEnabled(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotionEnabled;
}
