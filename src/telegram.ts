declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        shareToStory?: (mediaUrl: string, params?: Record<string, string>) => void;
        openTelegramLink?: (url: string) => void;
        showPopup?: (params: { title?: string; message: string; buttons?: Array<{ type: string; text?: string }> }) => void;
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

const OFFICIAL_BOT_URL = 'https://t.me/DevTycoon_bot';
const SHARE_IMAGE_PLACEHOLDER = '';

function safeTelegramCall(callback: () => void) {
  try {
    callback();
  } catch {
    // Telegram WebView methods are best-effort. They must never block game startup.
  }
}

function maskedReferralCode() {
  const userId = Number(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 0);
  if (!Number.isFinite(userId) || userId <= 0) return 'guest';
  const mixed = (userId ^ 0x5f3759df) >>> 0;
  return `r_${mixed.toString(36)}`;
}

function referralShareText(referralUrl: string) {
  return `У тебя не получится сделать игру лучше моей😼 \nМожешь зайти и убедиться в этом сам\n\n${referralUrl}`;
}

function showStoryPlaceholder(text: string) {
  safeTelegramCall(() => window.Telegram?.WebApp?.showPopup?.({
    title: 'История релиза',
    message: `Скоро здесь появится публикация истории с картинкой.\n\n${text.slice(0, 140)}`,
    buttons: [{ type: 'ok' }],
  }));
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
  const isReferralShare = payload.url?.includes('ref_demo') || text.includes('лучше моей');
  const isStoryShare = payload.url?.includes('share_release') || Boolean(payload.storyText && !isReferralShare);

  if (isStoryShare) {
    if (payload.imageUrl || SHARE_IMAGE_PLACEHOLDER) {
      const mediaUrl = payload.imageUrl || SHARE_IMAGE_PLACEHOLDER;
      safeTelegramCall(() => window.Telegram?.WebApp?.shareToStory?.(mediaUrl, { text: payload.storyText ?? text.slice(0, 180) }));
      return;
    }
    showStoryPlaceholder(payload.storyText ?? text);
    return;
  }

  const shareTargetUrl = isReferralShare
    ? `${OFFICIAL_BOT_URL}?startapp=${maskedReferralCode()}`
    : (payload.url ?? OFFICIAL_BOT_URL);
  const finalText = isReferralShare ? referralShareText(shareTargetUrl) : text.slice(0, 220);
  const safeText = encodeURIComponent(finalText);
  const shareUrl = encodeURIComponent(shareTargetUrl);
  const url = `https://t.me/share/url?url=${shareUrl}&text=${safeText}`;

  if (window.Telegram?.WebApp?.openTelegramLink) {
    safeTelegramCall(() => window.Telegram?.WebApp?.openTelegramLink?.(url));
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export {};
