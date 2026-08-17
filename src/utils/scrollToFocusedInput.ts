import { RefObject } from 'react';
import { NativeSyntheticEvent, ScrollView, TargetedEvent } from 'react-native';

// ScrollView ships the underlying scroll-to-keyboard machinery, but nothing
// calls it automatically on focus — wire scrollToFocusedInput to a TextInput's
// onFocus (with a ref to its enclosing ScrollView) to keep the field visible
// above the keyboard. When content above the field can grow while it stays
// focused (e.g. adding a row to a list right above an "add new" input), call
// scrollNodeIntoViewAboveKeyboard again after the layout settles — onFocus
// only fires once, so the field can drift back under the keyboard otherwise.
const EXTRA_OFFSET = 24;

export function scrollNodeIntoViewAboveKeyboard(
  scrollViewRef: RefObject<ScrollView | null>,
  node: unknown
) {
  scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(node, EXTRA_OFFSET, true);
}

export function scrollToFocusedInput(
  scrollViewRef: RefObject<ScrollView | null>,
  event: NativeSyntheticEvent<TargetedEvent>
) {
  scrollNodeIntoViewAboveKeyboard(scrollViewRef, event.target);
}
