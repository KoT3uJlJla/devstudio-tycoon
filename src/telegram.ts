declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        shareToStory?: (mediaUrl: string, params?: { text?: string; widget_link?: { url: string; name?: string } }) => void;
        isVersionAtLeast?: (version: string) => boolean;
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
const SHARE_RELEASE_STORY_IMAGE = '/share-release-story.png';

function absoluteAssetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function safeTelegramCall(callback: () => void) {
  try {
    callback();
  } catch {
    // Telegram WebView methods are best-effort. They must never block game startup.
  }
}

function referralCode() {
  const userId = String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || '').replace(/\D/g, '');
  return userId ? `u_${userId}` : 'guest';
}

function referralUrl() {
  return `${OFFICIAL_BOT_URL}?startapp=${referralCode()}`;
}

function referralShareText(refUrl: string) {
  return `У тебя не получится сделать игру лучше моей😼\nМожешь зайти и убедиться в этом сам\n\n${refUrl}`;
}

function canShareToStory() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp?.shareToStory) return false;
  if (typeof webApp.isVersionAtLeast === 'function') return webApp.isVersionAtLeast('7.8');
  return true;
}

function showStoryPlaceholder(text: string, refUrl: string) {
  safeTelegramCall(() => window.Telegram?.WebApp?.showPopup?.({
    title: 'История релиза',
    message: `Скоро здесь появится публикация истории с картинкой.\n\n${text.slice(0, 120)}\n${refUrl}`,
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
  const refUrl = referralUrl();

  if (isStoryShare) {
    const mediaUrl = absoluteAssetUrl(payload.imageUrl || SHARE_RELEASE_STORY_IMAGE);
    if (canShareToStory()) {
      safeTelegramCall(() => window.Telegram?.WebApp?.shareToStory?.(mediaUrl, {
        text: (payload.storyText ?? text).slice(0, 200),
        widget_link: { url: refUrl, name: 'Играть' },
      }));
      return;
    }
    showStoryPlaceholder(payload.storyText ?? text, refUrl);
    return;
  }

  // For referral shares the visible link must be the real bot startapp link.
  // Telegram will not attach our custom OG image to a t.me link, but this keeps
  // the referral destination clear and avoids the confusing intermediate URL.
  const shareTargetUrl = isReferralShare ? refUrl : (payload.url ?? OFFICIAL_BOT_URL);
  const finalText = isReferralShare ? referralShareText(refUrl) : text.slice(0, 220);
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