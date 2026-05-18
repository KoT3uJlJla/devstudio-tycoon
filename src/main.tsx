import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './mobile-topbar.css';
import './v8-ui-patch.css';
import { installReleaseUiPatch } from './release-ui-patch';
import { installBalanceLoadFix } from './balance-load-fix';

installReleaseUiPatch();
installBalanceLoadFix();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);