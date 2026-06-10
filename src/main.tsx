import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installGameLanguage } from './i18n';
import './styles.css';
import './mobile-topbar.css';
import './v8-ui-patch.css';
import './predeploy-hardening.css';
import './gameplay-ui-polish.css';
import './ton-connect-overrides.css';
import './release-results-update.css';
import './studio-office-layout-fix.css';

installGameLanguage();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
