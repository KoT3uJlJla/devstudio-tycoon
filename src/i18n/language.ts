export type Language = 'ru' | 'en';

type TelegramLanguageSource = {
  initDataUnsafe?: { user?: { language_code?: string } };
  language_code?: string;
};

export function readTelegramLanguageCode(): string {
  if (typeof window === 'undefined') return 'en';
  const webApp = window.Telegram?.WebApp as unknown as TelegramLanguageSource | undefined;

  return (
    webApp?.initDataUnsafe?.user?.language_code ||
    webApp?.language_code ||
    navigator.language ||
    navigator.languages?.[0] ||
    'en'
  );
}

export function detectLanguage(): Language {
  return readTelegramLanguageCode().toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function localeForLanguage(language: Language) {
  return language === 'ru' ? 'ru-RU' : 'en-US';
}
