import React from 'react';
import { createRoot } from 'react-dom/client';
import AppWithServerSync from './AppWithServerSync';
import './styles.css';
import './mobile-topbar.css';
import './v8-ui-patch.css';
import './predeploy-hardening.css';
import './gameplay-ui-polish.css';
import { installReleaseUiPatch } from './release-ui-patch';
import { installBackendDevUiPatch } from './backend-dev-ui-patch';
import { installBackendEconomyUiPatch } from './backend-economy-ui-patch';
import { installAuthoritativeWalletUiPatch } from './authoritative-wallet-ui-patch';
import { installResearchSafePatch } from './research-safe-patch';
import { installGameplayUiPolish } from './gameplay-ui-polish';
import { reconcileStartupSave } from './startup-save-reconcile';

async function boot() {
  await reconcileStartupSave();

  installReleaseUiPatch();
  installBackendDevUiPatch();
  installBackendEconomyUiPatch();
  installAuthoritativeWalletUiPatch();
  installResearchSafePatch();
  installGameplayUiPolish();

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppWithServerSync />
    </React.StrictMode>,
  );
}

void boot();
