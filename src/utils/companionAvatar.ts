export const COMPANION_AVATAR_PALETTE = [
  { color: '#3F3F46', tint: '#F0F0F1' },
  { color: '#3B82D6', tint: '#E9F1FF' },
  { color: '#159C87', tint: '#E7F6F1' },
  { color: '#EA8C3A', tint: '#FFF4E8' },
  { color: '#DB5C8C', tint: '#FDECF2' },
  { color: '#4C9E4C', tint: '#EAF4EA' },
];

export function companionAvatarColor(index: number) {
  return COMPANION_AVATAR_PALETTE[index % COMPANION_AVATAR_PALETTE.length];
}
