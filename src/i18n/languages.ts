export type LanguageCode = 'en' | 'fr' | 'de' | 'es' | 'he';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  rtl: boolean;
  locale: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', rtl: false, locale: 'en-US' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', rtl: false, locale: 'fr-FR' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', rtl: false, locale: 'de-DE' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', rtl: false, locale: 'es-ES' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית', rtl: true, locale: 'he-IL' },
];

export function languageInfo(code: LanguageCode): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
