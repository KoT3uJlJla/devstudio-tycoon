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

export function initTelegram() {
  const webApp = window.Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
  webApp?.setHeaderColor?.('#070811');
  webApp?.setBackgroundColor?.('#070811');
  webApp?.enableClosingConfirmation?.();
}

export function haptic(type: 'tap' | 'success' | 'warning' = 'tap') {
  if (type === 'tap') window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
  if (type === 'success') window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
  if (type === 'warning') window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('warning');
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

  // Подготовлено под будущий шеринг картинок: когда появится публичная картинка,
  // достаточно передать imageUrl. В Telegram Mini Apps она сможет уйти в Story.
  if (payload.imageUrl && window.Telegram?.WebApp?.shareToStory) {
    window.Telegram.WebApp.shareToStory(payload.imageUrl, { text: payload.storyText ?? text.slice(0, 180) });
    return;
  }

  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export {};
