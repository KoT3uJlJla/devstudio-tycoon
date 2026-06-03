# Visual Rendering Layer

DevStudio Tycoon uses **PixiJS v8** as the game-world rendering layer for the Studio screen.

React and CSS remain responsible for application UI: layout, buttons, panels, readable text, Telegram Mini App controls, and gameplay flows. PixiJS is mounted behind that UI as a non-interactive canvas so existing buttons and HTML controls stay clickable.

PixiJS should be used for visual game atmosphere, including:

- procedural studio-room art and desk scenes;
- ambience, glow, haze, and neon rim lighting;
- animated backgrounds with parallax depth;
- lightweight particle systems for dust, code sparks, science motes, tiny coins, and celebration effects;
- future release celebration effects;
- future FTUE spotlight and visual guidance effects.

Future visual work should reuse the `src/rendering` module rather than adding CSS-only fake art or one-off rendering code elsewhere. Keep gameplay, save logic, backend sync, shop, referrals, leaderboard, and patch-chain scripts separate from this rendering layer.

Performance expectations for this layer:

- keep particle counts conservative for Telegram mobile WebViews;
- prefer generated textures and sprites for repeated visual elements;
- avoid expensive per-frame `Graphics` redraws;
- pause animation when the document is hidden;
- respect `prefers-reduced-motion` by reducing particles and strong animation;
- do not block pointer events or reduce UI readability.
