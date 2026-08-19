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
  const contentScrollY = useRef(0);

  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [visible, translateY]);

  const handleMove = (gesture: { dy: number }) => {
    if (gesture.dy > 0) translateY.setValue(gesture.dy);
  };
  const handleRelease = (gesture: { dy: number; vy: number }) => {
    if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
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
        onPanResponderMove: (_, gesture) => handleMove(gesture),
        onPanResponderRelease: (_, gesture) => handleRelease(gesture),
        onPanResponderTerminate: handleTerminate,
      }),
    [onClose, translateY]
  );

  // Lets a long scrollable body (e.g. a form) dismiss the sheet too: once the
  // content is scrolled back to the top, continuing to drag down takes the
  // gesture away from the ScrollView (which would otherwise just no-op/bounce)
  // and hands it to us instead. Spread `contentHandlers` on a plain View
  // wrapping the scrollable content — not the ScrollView itself — so the
  // capture check runs before the ScrollView's own responder claims the touch.
  const contentPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          contentScrollY.current <= 0 &&
          gesture.dy > 8 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5,
        onPanResponderMove: (_, gesture) => handleMove(gesture),
        onPanResponderRelease: (_, gesture) => handleRelease(gesture),
        onPanResponderTerminate: handleTerminate,
      }),
    [onClose, translateY]
  );

  return {
    grabberHandlers: grabberPanResponder.panHandlers,
    contentHandlers: contentPanResponder.panHandlers,
    onContentScroll: (offsetY: number) => {
      contentScrollY.current = offsetY;
    },
    translateY,
  };
}
