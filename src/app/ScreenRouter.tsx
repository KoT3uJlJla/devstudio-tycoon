import type { ReactNode } from 'react';
import type { GameState } from '../types';

type ScreenRouterProps = {
  screen: GameState['screen'];
  routes: Partial<Record<GameState['screen'], ReactNode>>;
};

export function ScreenRouter({ screen, routes }: ScreenRouterProps) {
  return (
    <section className={`screen-card ${screen === 'studio' ? 'screen-card--studio' : ''}`}>
      <div className="screen-card-content">{routes[screen] ?? null}</div>
    </section>
  );
}
