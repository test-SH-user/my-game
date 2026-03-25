# Space Shooter — Design Assumptions

## Canvas & Display
- Canvas is fixed at **800×600px** and is not responsive/scalable.
- The game is centered on a black page background.
- No mobile/touch support; keyboard-only controls.

## Gameplay Rules
- The player has **one life** — no health bar, shields, or extra lives.
- A single enemy reaching the bottom ends the game immediately.
- **Score** = 1 point per enemy destroyed. There is no bonus multiplier.
- All bullets travel straight up; there is no spread or power-up system.

## Difficulty Scaling
- Enemy base speed starts at **1.5 px/frame**.
- Every **10 kills**, enemy speed increases by **0.3 px/frame** (no cap).
- Enemy spawn interval is fixed at **1200ms** throughout the game.

## Controls
- `ArrowLeft` / `ArrowRight` — move player ship horizontally.
- `Space` — fire a bullet (300ms cooldown to prevent bullet spam).
- `Space` on the start/game-over screen — transition game state.

## Enemies
- Enemies spawn at a random horizontal position along the top edge.
- All enemies move **straight down** — no lateral movement or patterns.
- Enemies are removed when hit by a bullet (no health/multi-hit enemies).

## Bullets
- Only the player fires bullets; enemies do not shoot back.
- Bullets are removed when they leave the top of the canvas or hit an enemy.

## Visuals
- Stars are generated once at startup and remain static (no parallax).
- Player ship is a stylised polygon (blue/cyan) with an orange engine glow.
- Enemies are pentagon-shaped (red) with a lighter cockpit highlight.
- No animations beyond movement (no explosions, particles, or sound effects).

## Audio
- No audio. Sound effects and music are out of scope.

## Browser Support
- Targets modern browsers with HTML5 Canvas and ES6+ support.
- No polyfills or transpilation — vanilla JS only, no build step required.
