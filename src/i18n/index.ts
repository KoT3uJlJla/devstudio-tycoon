import { en } from './en';
import { detectLanguage, localeForLanguage, type Language } from './language';
import { ru } from './ru';

export type { Language };
export { detectLanguage, localeForLanguage, readTelegramLanguageCode } from './language';
export type TranslationKey = keyof typeof ru;
export type TranslationParams = Record<string, string | number>;

let currentLanguage: Language | null = null;

export function getLanguage(): Language {
  currentLanguage ??= detectLanguage();
  return currentLanguage;
}

export function getLocale() {
  return localeForLanguage(getLanguage());
}

export function installGameLanguage() {
  if (typeof document === 'undefined') return;
  const language = getLanguage();
  document.documentElement.lang = language;
  document.documentElement.dataset.gameLanguage = language;
}

export function t(key: TranslationKey, params: TranslationParams = {}): string {
  const language = getLanguage();
  const source = language === 'ru' ? ru : en;
  const template = source[key] ?? en[key] ?? ru[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (match, name: string) => (
    params[name] === undefined ? match : String(params[name])
  ));
}

export function localizedName<T extends { name: string; nameEn?: string }>(item: T | null | undefined): string {
  if (!item) return '';
  return getLanguage() === 'en' && item.nameEn ? item.nameEn : item.name;
}

export function localizedTitle<T extends { title: string; titleEn?: string }>(item: T | null | undefined): string {
  if (!item) return '';
  return getLanguage() === 'en' && item.titleEn ? item.titleEn : item.title;
}

export function localizedDescription<T extends { description: string; descriptionEn?: string }>(item: T | null | undefined): string {
  if (!item) return '';
  return getLanguage() === 'en' && item.descriptionEn ? item.descriptionEn : item.description;
}

export function localizedEffect<T extends { effect: string; effectEn?: string }>(item: T | null | undefined): string {
  if (!item) return '';
  return getLanguage() === 'en' && item.effectEn ? item.effectEn : item.effect;
}
