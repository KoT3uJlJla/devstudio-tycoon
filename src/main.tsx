import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './mobile-topbar.css';
import './v8-ui-patch.css';
import { installReleaseUiPatch } from './release-ui-patch';
import { installBackendDevUiPatch } from './backend-dev-ui-patch';
import { installBackendEconomyUiPatch } from './backend-economy-ui-patch';
import { installAuthoritativeWalletUiPatch } from './authoritative-wallet-ui-patch';
import { installBackendResearchUiPatch } from './backend-research-ui-patch';
import { reconcileStartupSave } from './startup-save-reconcile';

async function boot() {
  await reconcileStartupSave();

  installReleaseUiPatch();
  installBackendDevUiPatch();
  installBackendEconomyUiPatch();
  installAuthoritativeWalletUiPatch();
  installBackendResearchUiPatch();

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void boot();
