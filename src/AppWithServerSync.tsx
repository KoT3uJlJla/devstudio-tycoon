import { useEffect, useState } from 'react';
import App from './App';

export default function AppWithServerSync() {
  const [syncVersion, setSyncVersion] = useState(0);

  useEffect(() => {
    const onServerSave = () => {
      // Remount the game from the freshly persisted server save. This keeps the
      // update inside the Mini App shell and avoids a browser/page reload while
      // making React state authoritative after protected backend actions.
      setSyncVersion((value) => value + 1);
    };
    window.addEventListener('devstudio:server-save', onServerSave);
    return () => window.removeEventListener('devstudio:server-save', onServerSave);
  }, []);

  return <App key={syncVersion} />;
}
