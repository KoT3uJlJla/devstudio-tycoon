// Server save loading is handled by storage.ts. This startup hook used to merge
// wallet state with localStorage before React mounted, which allowed stale v2
// client saves to resurrect deleted users and flash wrong coin/star balances.
// Keep the exported function as a no-op so main.tsx stays stable while the app
// uses the server-authoritative v3 loading path.
export async function reconcileStartupSave() {
  return;
}
