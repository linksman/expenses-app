import { Translations } from '../i18n/translations';

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayLabel(iso: string, t: Translations, locale: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sameDay(date, today)) return t.manage.today;
  if (sameDay(date, yesterday)) return t.manage.yesterday;
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function timeLabel(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
