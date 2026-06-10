import telegramAnalytics from '@telegram-apps/analytics';

let analyticsInitialized = false;
let analyticsInitStarted = false;

export function initTelegramAnalytics() {
  if (analyticsInitialized || analyticsInitStarted) return;

  const token = import.meta.env.VITE_TG_ANALYTICS_TOKEN?.trim();
  const appName = import.meta.env.VITE_TG_ANALYTICS_APP_NAME?.trim();

  if (!token || !appName) {
    if (import.meta.env.DEV) {
      console.info('[analytics] Telegram Analytics disabled: env vars are missing');
    }
    return;
  }

  analyticsInitStarted = true;

  try {
    void telegramAnalytics.init({ token, appName })
      .then(() => {
        analyticsInitialized = true;
      })
      .catch((error) => {
        analyticsInitStarted = false;
        console.warn('[analytics] Telegram Analytics init failed', error);
      });
  } catch (error) {
    analyticsInitStarted = false;
    console.warn('[analytics] Telegram Analytics init failed', error);
  }
}
