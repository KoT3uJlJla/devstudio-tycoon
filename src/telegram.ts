declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        shareToStory?: (mediaUrl: string, params?: Record<string, string>) => void;
        openTelegramLink?: (url: string) => void;
        HapticFeedback?: {
          impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred?: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged?: () => void;
        };
        MainButton?: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setText: (text: string) => void;
        };
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        CloudStorage?: {
          setItem?: (key: string, value: string, callback?: (error?: string | null, success?: boolean) => void) => void;
          getItem?: (key: string, callback: (error?: string | null, value?: string | null) => void) => void;
        };
        initData?: string;
        initDataUnsafe?: {
          user?: { id: number; first_name?: string; username?: string; photo_url?: string };
          start_param?: string;
        };
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        enableClosingConfirmation?: () => void;
      };
    };
  }
}

function safeTelegramCall(callback: () => void) {
  try {
    callback();
  } catch {
    // Telegram WebView methods are best-effort. They must never block game startup.
  }
}

export function initTelegram() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  safeTelegramCall(() => webApp.ready?.());
  safeTelegramCall(() => webApp.expand?.());
  safeTelegramCall(() => webApp.setHeaderColor?.('#070811'));
  safeTelegramCall(() => webApp.setBackgroundColor?.('#070811'));
  safeTelegramCall(() => webApp.enableClosingConfirmation?.());
}

export function haptic(type: 'tap' | 'success' | 'warning' = 'tap') {
  safeTelegramCall(() => {
    if (type === 'tap') window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    if (type === 'success') window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
    if (type === 'warning') window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('warning');
  });
}

export type SharePayload = {
  url?: string;
  imageUrl?: string;
  storyText?: string;
};

export function shareRelease(text: string, payload: SharePayload = {}) {
  const safeText = encodeURIComponent(text.slice(0, 220));
  const shareUrl = encodeURIComponent(payload.url ?? 'https://t.me/devstudio_bot');
  const url = `https://t.me/share/url?url=${shareUrl}&text=${safeText}`;

  if (payload.imageUrl && window.Telegram?.WebApp?.shareToStory) {
    safeTelegramCall(() => window.Telegram?.WebApp?.shareToStory?.(payload.imageUrl!, { text: payload.storyText ?? text.slice(0, 180) }));
    return;
  }

  if (window.Telegram?.WebApp?.openTelegramLink) {
    safeTelegramCall(() => window.Telegram?.WebApp?.openTelegramLink?.(url));
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export {};
