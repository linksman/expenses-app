import { Translations } from '../i18n/translations';
import { ME_COMPANION_ID, TravelCompanion } from '../types/companion';

export function companionName(
  companionId: string,
  companions: TravelCompanion[],
  t: Translations
): string {
  if (companionId === ME_COMPANION_ID) return t.companions.me;
  return companions.find((c) => c.id === companionId)?.name ?? t.companions.unknown;
}
