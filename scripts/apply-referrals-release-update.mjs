import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function requireContains(source, needle, label) {
  if (!source.includes(needle)) throw new Error('referrals-release: missing ' + label);
}

function ensureBackendClientImport(source) {
  const required = ['claimReferralMilestone', 'hasBackendSession'];
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]\.\/backendClient['"];?/;
  const match = source.match(importRegex);
  if (match) {
    const names = match[1].split(',').map((name) => name.trim()).filter(Boolean);
    for (const item of required) if (!names.includes(item)) names.push(item);
    return source.replace(importRegex, `import { ${names.join(', ')} } from './backendClient';`);
  }
  return source.replace(
    "import { loadGame, resetGame, saveGame } from './storage';",
    "import { loadGame, resetGame, saveGame } from './storage';\nimport { claimReferralMilestone, hasBackendSession } from './backendClient';",
  );
}

function patchReferralClaim(source) {
  let next = source;
  const oldClaim = `  const claimMilestone = (id: string) => update((current) => {\n    const milestone = REFERRAL_MILESTONES.find((item) => item.id === id);\n    if (!milestone || current.referralMilestoneClaims?.[id] || (current.qualifiedReferrals ?? 0) < milestone.target) return current;\n    haptic('success');\n    return {\n      ...current,\n      coins: current.coins + milestone.reward.coins,\n            rp: current.rp + milestone.reward.rp,\n      referralMilestoneClaims: { ...(current.referralMilestoneClaims ?? {}), [id]: true },\n    };\n  });`;
  const oldClaimClean = `  const claimMilestone = (id: string) => update((current) => {\n    const milestone = REFERRAL_MILESTONES.find((item) => item.id === id);\n    if (!milestone || current.referralMilestoneClaims?.[id] || (current.qualifiedReferrals ?? 0) < milestone.target) return current;\n    haptic('success');\n    return {\n      ...current,\n      coins: current.coins + milestone.reward.coins,\n      rp: current.rp + milestone.reward.rp,\n      referralMilestoneClaims: { ...(current.referralMilestoneClaims ?? {}), [id]: true },\n    };\n  });`;
  const newClaim = `  const claimMilestone = async (id: string) => {\n    if (hasBackendSession()) {\n      const serverState = await claimReferralMilestone(id);\n      if (serverState) {\n        haptic('success');\n        update(() => serverState);\n      } else {\n        haptic('warning');\n      }\n      return;\n    }\n    update((current) => {\n      const milestone = REFERRAL_MILESTONES.find((item) => item.id === id);\n      if (!milestone || current.referralMilestoneClaims?.[id] || (current.qualifiedReferrals ?? 0) < milestone.target) return current;\n      haptic('success');\n      return {\n        ...current,\n        coins: current.coins + milestone.reward.coins,\n        rp: current.rp + milestone.reward.rp,\n        referralMilestoneClaims: { ...(current.referralMilestoneClaims ?? {}), [id]: true },\n      };\n    });\n  };`;

  if (next.includes(oldClaim)) next = next.replace(oldClaim, newClaim);
  else if (next.includes(oldClaimClean)) next = next.replace(oldClaimClean, newClaim);

  next = next.replace('onClick={() => claimMilestone(item.id)}', 'onClick={() => void claimMilestone(item.id)}');
  return next;
}

patchFile('src/backendClient.ts', (source) => {
  let next = source;
  if (!next.includes('export async function claimReferralMilestone')) {
    next += `\nexport async function claimReferralMilestone(milestoneId: string) {\n  const payload = await postJson('/api/economy/referral/claim', { milestoneId });\n  return stateFromPayload(payload);\n}\n`;
  }
  requireContains(next, 'export async function claimReferralMilestone', 'referral claim client');
  requireContains(next, 'export function hasBackendSession', 'backend session helper');
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = ensureBackendClientImport(source);
  next = patchReferralClaim(next);

  const oldShare = "shareRelease(`Заходи в DevStudio Tycoon и запускай свои хиты вместе со мной!`, { url: 'https://t.me/devstudio_bot?start=ref_demo', imageUrl: undefined, storyText: 'DevStudio Tycoon — приглашаю в студию!' })";
  const newShare = "shareRelease(`У тебя не получится сделать игру лучше моей😼`, { url: 'ref_demo', imageUrl: undefined, storyText: 'DevStudio Tycoon — приглашаю в студию!' })";
  next = next.replace(oldShare, newShare);

  requireContains(next, 'claimReferralMilestone', 'referral claim symbol');
  requireContains(next, 'hasBackendSession', 'backend session symbol');
  return next;
});
