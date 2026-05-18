import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './mobile-topbar.css';
import './v8-ui-patch.css';
import { installReleaseUiPatch } from './release-ui-patch';
import { installBackendDevUiPatch } from './backend-dev-ui-patch';

installReleaseUiPatch();
installBackendDevUiPatch();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);