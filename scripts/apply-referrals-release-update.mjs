import { readFileSync, writeFileSync } from 'node:fs';

function patchFile(path, patcher) {
  const source = readFileSync(path, 'utf8');
  const next = patcher(source);
  if (next !== source) writeFileSync(path, next);
}

function requireContains(source, needle, label) {
  if (!source.includes(needle)) throw new Error('referrals-release: missing ' + label);
}

patchFile('src/backendClient.ts', (source) => {
  let next = source;
  if (!next.includes('export async function claimReferralMilestone')) {
    next += `\nexport async function claimReferralMilestone(milestoneId: string) {\n  const payload = await postJson('/api/economy/referral/claim', { milestoneId });\n  return stateFromPayload(payload);\n}\n`;
  }
  requireContains(next, 'export async function claimReferralMilestone', 'referral claim client');
  return next;
});

patchFile('src/App.tsx', (source) => {
  let next = source;
  if (!next.includes('claimReferralMilestone')) {
    next = next.replace(
      "import { loadGame, resetGame, saveGame } from './storage';",
      "import { loadGame, resetGame, saveGame } from './storage';\nimport { claimReferralMilestone, hasBackendSession } from './backendClient';",
    );
  }

  const oldClaim = `  const claimMilestone = (id: string) => update((current) => {\n    const milestone = REFERRAL_MILESTONES.find((item) => item.id === id);\n    if (!milestone || current.referralMilestoneClaims?.[id] || (current.qualifiedReferrals ?? 0) < milestone.target) return current;\n    haptic('success');\n    return {\n      ...current,\n      coins: current.coins + milestone.reward.coins,\n            rp: current.rp + milestone.reward.rp,\n      referralMilestoneClaims: { ...(current.referralMilestoneClaims ?? {}), [id]: true },\n    };\n  });`;
  const newClaim = `  const claimMilestone = async (id: string) => {\n    if (hasBackendSession()) {\n      const serverState = await claimReferralMilestone(id);\n      if (serverState) {\n        haptic('success');\n        update(() => serverState);\n      } else {\n        haptic('warning');\n      }\n      return;\n    }\n    update((current) => {\n      const milestone = REFERRAL_MILESTONES.find((item) => item.id === id);\n      if (!milestone || current.referralMilestoneClaims?.[id] || (current.qualifiedReferrals ?? 0) < milestone.target) return current;\n      haptic('success');\n      return {\n        ...current,\n        coins: current.coins + milestone.reward.coins,\n        rp: current.rp + milestone.reward.rp,\n        referralMilestoneClaims: { ...(current.referralMilestoneClaims ?? {}), [id]: true },\n      };\n    });\n  };`;
  if (next.includes(oldClaim)) next = next.replace(oldClaim, newClaim);
  next = next.replace('onClick={() => claimMilestone(item.id)}', 'onClick={() => void claimMilestone(item.id)}');

  const oldShare = "shareRelease(`Заходи в DevStudio Tycoon и запускай свои хиты вместе со мной!`, { url: 'https://t.me/devstudio_bot?start=ref_demo', imageUrl: undefined, storyText: 'DevStudio Tycoon — приглашаю в студию!' })";
  const newShare = "shareRelease(`У тебя не получится сделать игру лучше моей😼`, { url: 'ref_demo', imageUrl: undefined, storyText: 'DevStudio Tycoon — приглашаю в студию!' })";
  next = next.replace(oldShare, newShare);

  requireContains(next, "import { claimReferralMilestone, hasBackendSession }", 'referral imports');
  requireContains(next, 'const claimMilestone = async', 'server referral claim');
  requireContains(next, 'void claimMilestone(item.id)', 'async milestone click');
  return next;
});
