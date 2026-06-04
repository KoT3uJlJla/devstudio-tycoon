# Copilot Instructions for devstudio-tycoon

## Project context
- Project: Telegram Mini App game.
- Stack: React + Vite + TypeScript frontend, Node.js backend, MongoDB, Telegram WebApp SDK, Render deployment, optional TON integrations.
- Prefer small, incremental changes that keep the existing architecture intact.
- Preserve existing gameplay, economy, and UI behavior unless explicitly asked to change it.

## Coding guidelines
- Use TypeScript for new frontend logic when possible.
- Keep functions small, readable, and well named.
- Prefer simple readable code over clever abstractions.
- Do not add heavy dependencies without asking.
- Keep game economy constants in config files.
- Avoid breaking the build or runtime behavior of the current app.

## UI and gameplay rules
- Mobile-first UI for Telegram Mini Apps.
- Target viewport: 390px mobile width.
- Maintain consistent naming and copy tone already used in the project.
- Avoid introducing visual regressions or major layout shifts.
- Preserve game state logic, economy balance, and user-facing copy unless requested.

## Server / tooling rules
- Never trust client-side balance changes.
- Validate Telegram initData on the backend.
- Balance operations must be idempotent.
- If modifying server code, keep error handling explicit and safe.
- Use clear error states and loading states.
- Prefer existing configuration and script conventions already in the repo.
- Update README when deployment steps or env variables change.

## When helping with changes
- Explain the reason for the change briefly.
- Prefer minimal diffs.
- If a fix affects gameplay, state the expected impact clearly.
- When uncertain, prefer safe, conservative edits over risky rewrites.

## Preferred workflow
1. Inspect existing related files before changing code.
2. Make the smallest fix that addresses the problem.
3. Verify the result with available checks (build, tests, or lint if present).
4. Before finishing a task, check npm install, npm run build, and explain what was tested.
5. Summarize what changed and any risks or follow-up items.
