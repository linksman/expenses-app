import { translateToEnglish } from './translateToEnglish';

const UNSPLASH_SEARCH_ENDPOINT = 'https://api.unsplash.com/search/photos';

const TRIP_WORDS = new Set([
  'trip', 'travel', 'vacation', 'holiday', 'visit', 'journey', 'summer', 'winter',
  'spring', 'autumn', 'fall', 'to', 'in', 'the', 'our',
  'voyage', 'séjour', 'vacances', 'à', 'au', 'aux',
  'reise', 'urlaub', 'nach',
  'viaje', 'vacaciones', 'a',
  'טיול', 'חופשה', 'אל', 'ל',
]);

function destinationQuery(name: string): string {
  const cleaned = name
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word && !TRIP_WORDS.has(word.toLocaleLowerCase()))
    .join(' ')
    .trim();
  return cleaned || name.trim();
}

function destinationQueries(name: string): string[] {
  const fullQuery = destinationQuery(name);
  if (!fullQuery) return [];

  const words = fullQuery.split(/\s+/).filter(Boolean);
  const queries = [fullQuery];

  // Try shorter contiguous phrases before individual words. Keeping the
  // original order makes place names such as "New York City" stay meaningful.
  for (let length = words.length - 1; length >= 1; length -= 1) {
    for (let start = 0; start + length <= words.length; start += 1) {
      queries.push(words.slice(start, start + length).join(' '));
    }
  }

  return [...new Set(queries)];
}

export interface DestinationImageResult {
  url: string;
  photographerName: string;
  photographerUrl: string;
  unsplashUrl: string;
}

interface UnsplashPhoto {
  urls?: { regular?: string };
  links?: { html?: string };
  user?: { name?: string; links?: { html?: string } };
}

async function searchDestinationImage(
  query: string,
  accessKey: string
): Promise<DestinationImageResult | null> {
  const params = [
    `query=${encodeURIComponent(`${query} travel destination`)}`,
    'orientation=landscape',
    'content_filter=high',
    'per_page=1',
  ].join('&');

  try {
    const response = await fetch(`${UNSPLASH_SEARCH_ENDPOINT}?${params}`, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const photo: UnsplashPhoto | undefined = payload?.results?.[0];
    const url = photo?.urls?.regular;
    if (!url) return null;
    const referral = 'utm_source=vacation_expenses&utm_medium=referral';
    const withReferral = (value: string | undefined) =>
      value ? `${value}${value.includes('?') ? '&' : '?'}${referral}` : 'https://unsplash.com';
    return {
      url,
      photographerName: photo.user?.name ?? 'Unsplash photographer',
      photographerUrl: withReferral(photo.user?.links?.html),
      unsplashUrl: withReferral(photo.links?.html),
    };
  } catch {
    return null;
  }
}

export async function findDestinationImage(name: string): Promise<DestinationImageResult | null> {
  const accessKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!accessKey || !name.trim()) return null;

  const englishName = await translateToEnglish(name);
  for (const query of destinationQueries(englishName)) {
    const image = await searchDestinationImage(query, accessKey);
    if (image) return image;
  }

  return null;
}
