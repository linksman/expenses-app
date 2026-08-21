const GOOGLE_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_TRANSLATE_ENDPOINT = 'https://api.mymemory.translated.net/get';

// Plain Unicode code-point ranges (\uXXXX) rather than a `\p{Script=Hebrew}`
// property escape: Hermes (React Native's JS engine on-device) has
// historically had gaps in Unicode regex support, and a regex literal that
// throws there would reject this whole function on every call — silently
// breaking every caller downstream (e.g. category guessing) even though the
// exact same code works fine in a browser's V8 engine. U+0590-05FF is the
// Hebrew block; U+FB1D-FB4F is the Hebrew presentation-forms block
// (ligatures/final-letter variants occasionally produced by input methods).
const HEBREW_RANGE = /[\u0590-\u05FF\uFB1D-\uFB4F]/;

// Both providers are free and keyless. Google Translate's anonymous endpoint is
// blocked in some app runtimes, so Hebrew (the only supported non-Latin UI
// language) goes through MyMemory first, falling through to Google — which also
// handles automatic language detection for everything else. On any failure this
// resolves to the original text rather than throwing, so callers can treat the
// result as "best-effort English" and keep working offline.
export async function translateToEnglish(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  if (HEBREW_RANGE.test(trimmed)) {
    try {
      const response = await fetch(
        `${MYMEMORY_TRANSLATE_ENDPOINT}?q=${encodeURIComponent(trimmed)}&langpair=he%7Cen`
      );
      if (response.ok) {
        const payload = await response.json();
        const translated = payload?.responseData?.translatedText;
        if (typeof translated === 'string' && translated.trim()) {
          return translated.trim();
        }
      }
    } catch {
      // Fall through to the second translation provider.
    }
  }

  const params = ['client=gtx', 'sl=auto', 'tl=en', 'dt=t', `q=${encodeURIComponent(trimmed)}`].join(
    '&'
  );

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_ENDPOINT}?${params}`);
    if (!response.ok) return trimmed;

    const payload = await response.json();
    const translated = Array.isArray(payload?.[0])
      ? payload[0]
          .map((part: unknown) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
          .join('')
          .trim()
      : '';
    return translated || trimmed;
  } catch {
    return trimmed;
  }
}
