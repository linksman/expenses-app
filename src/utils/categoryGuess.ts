import { Category } from '../types/expense';
import { translateToEnglish } from './translateToEnglish';

// Ordered so a description matching more than one list picks the earlier,
// more specific category — e.g. "grocery store" hits Groceries before the
// generic "store" keyword under Shopping ever gets a chance to match.
const CATEGORY_KEYWORDS: [Category, string[]][] = [
  [
    'Food',
    [
      'restaurant', 'food', 'lunch', 'dinner', 'breakfast', 'brunch', 'coffee', 'cafe',
      'meal', 'snack', 'pizza', 'burger', 'sushi', 'bar', 'drinks', 'bakery', 'diner',
      'eat', 'noodle', 'sandwich', 'taco', 'buffet',
    ],
  ],
  [
    'Groceries',
    ['grocery', 'groceries', 'supermarket', 'convenience store', 'pharmacy', 'drugstore'],
  ],
  [
    'Lodging',
    [
      'hotel', 'hostel', 'airbnb', 'motel', 'resort', 'lodging', 'accommodation',
      'guesthouse', 'check-in', 'check in', 'room booking',
    ],
  ],
  [
    'Transport',
    [
      'taxi', 'uber', 'lyft', 'bus', 'train', 'metro', 'subway', 'flight', 'airline',
      'airport', 'car rental', 'rental car', 'gas', 'fuel', 'parking', 'ferry', 'toll',
      'ride', 'transit', 'tram',
    ],
  ],
  [
    'Activities',
    [
      'ticket', 'tour', 'museum', 'excursion', 'activity', 'attraction', 'hike', 'safari',
      'cruise', 'admission', 'zoo', 'aquarium', 'guide', 'rental gear', 'diving', 'skiing',
    ],
  ],
  [
    'Entertainment',
    [
      'movie', 'cinema', 'theater', 'theatre', 'club', 'nightclub', 'karaoke', 'arcade',
      'concert', 'show', 'festival', 'entertainment',
    ],
  ],
  [
    'Shopping',
    ['shopping', 'store', 'mall', 'souvenir', 'clothes', 'clothing', 'shoes', 'gift', 'boutique', 'market'],
  ],
];

function classify(englishText: string): Category {
  const lower = englishText.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => lower.includes(keyword))) return category;
  }
  return 'Other';
}

// Best-effort category guess from a free-text expense description: translate
// to English (the descriptions are entered in the app's UI language) then
// match against a curated keyword list per category. Falls back to 'Other'
// when nothing matches or translation fails outright — this never throws, so
// callers can fire-and-forget it without a try/catch of their own.
export async function guessCategory(description: string): Promise<Category> {
  const trimmed = description.trim();
  if (!trimmed) return 'Other';
  try {
    const english = await translateToEnglish(trimmed);
    return classify(english || trimmed);
  } catch {
    // translateToEnglish already catches its own network failures, but this
    // guarantees the "never throws" contract above regardless of what else
    // could go wrong (e.g. an unexpected engine-specific error), so callers
    // can genuinely fire-and-forget without a dangling unhandled rejection.
    return classify(trimmed);
  }
}
