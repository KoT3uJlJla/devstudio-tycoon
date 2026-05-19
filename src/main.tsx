import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './mobile-topbar.css';
import './v8-ui-patch.css';
import './predeploy-hardening.css';
import './gameplay-ui-polish.css';
import { installReleaseUiPatch } from './release-ui-patch';
import { installGameplayUiPolish } from './gameplay-ui-polish';
import { reconcileStartupSave } from './startup-save-reconcile';

async function boot() {
  await reconcileStartupSave();

  installReleaseUiPatch();
  installGameplayUiPolish();

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void boot();
