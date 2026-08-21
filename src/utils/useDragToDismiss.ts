import { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.5;

// Lets a bottom-sheet's grabber handle be dragged down to dismiss it. Spread
// the returned `handlers` onto the grabber (not the whole sheet, so it
// doesn't fight FlatList scrolling), and apply `translateY` as a transform
// on the sheet's outermost Animated.View so it follows the finger while
// dragging and springs back if released short of the dismiss distance.
//
// On a dismiss, `translateY` is deliberately left at its dragged offset
// rather than snapped back to 0 before calling onClose: resetting it first
// made the sheet visibly jump back to its resting position for a frame
// before the Modal's own close animation played, producing a flicker.
// Leaving it where the finger released it lets the drag motion continue
// straight into the Modal's slide-out. `visible` is only used to reset the
// offset the next time the sheet opens, since the underlying Animated.Value
// persists across the sheet being hidden and shown again.
export function useDragToDismiss(onClose: () => void, visible: boolean) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  const handleMove = (dy: number) => {
    translateY.setValue(Math.max(0, dy));
  };
  const handleRelease = (dy: number, vy: number) => {
    if (dy > DISMISS_DISTANCE || vy > DISMISS_VELOCITY) {
      onClose();
    } else {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    }
  };
  const handleTerminate = () => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
  };

  const grabberPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_, gesture) => handleMove(gesture.dy),
        onPanResponderRelease: (_, gesture) => handleRelease(gesture.dy, gesture.vy),
        onPanResponderTerminate: handleTerminate,
        onPanResponderTerminationRequest: () => false,
      }),
    [onClose, translateY]
  );

  return {
    grabberHandlers: grabberPanResponder.panHandlers,
    translateY,
  };
}
