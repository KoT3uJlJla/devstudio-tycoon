(() => {
  const updateOfflineState = () => {
    document.body.classList.toggle('boot-is-offline', navigator.onLine === false);
  };

  updateOfflineState();
  window.addEventListener('online', updateOfflineState, { passive: true });
  window.addEventListener('offline', updateOfflineState, { passive: true });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }, { once: true });
  }
})();
