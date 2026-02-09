# Unfinished Commands and Features (bot)

Date: 2026-02-08
Scope: z:/POLLUX/POLARIS/DEV/bot
Method: Scanned for TODO/FIXME/WIP/STUB markers, plus a manual flow review of minigames/archetypes.

## Findings

- Global types note: "string colours" remains TODO in [types/global.d.ts](types/global.d.ts#L74).
- Global export unclear: `piggyback` noted as TODO (unknown purpose) in [types/global.d.ts](types/global.d.ts#L114).
- Highscores response formatting: current output hits max chars (FIXME) in [core/commands/games/highscores.js](core/commands/games/highscores.js#L29).

## Deeper Scan: Minigames and Archetypes

Minigames (core/commands/games):
- Highscores response formatting: current output hits max chars (FIXME) in [core/commands/games/highscores.js](core/commands/games/highscores.js#L29).
- Highscores list references hangmaid highscores as "SOON" (still disabled) in [core/commands/games/highscores.js](core/commands/games/highscores.js#L13).

Archetypes (core/archetypes):
- Airline logic appears half-baked: `await` is used inside a non-async callback, which would throw a syntax error and block slot purchases in [core/archetypes/Airline.js](core/archetypes/Airline.js#L14-L18).
- No other TODO/FIXME/WIP/STUB markers found in the DEV tree.

## Flow Review (Gameplay Loop Completeness)

- Airline command has no playable flow: base command only sends a placeholder line and no guidance or stateful loop in [core/commands/games/airline/index.js](core/commands/games/airline/index.js#L4-L24).
- Airline route creation stalls at UI selection and never persists a route (no call to create/charge a route after selections) in [core/commands/games/airline/routes/new.js](core/commands/games/airline/routes/new.js#L3-L76).
- Airline slot purchase path is effectively broken by an invalid `await` usage inside a non-async callback, so the “buy slot” flow cannot complete in [core/archetypes/Airline.js](core/archetypes/Airline.js#L10-L22).
- Fishing is gated to a single hard-coded user and uses fixed rod/bait, which prevents a normal play loop for other users in [core/commands/games/fish.js](core/commands/games/fish.js#L3-L20).
- Tarot is disabled and the command only renders a spread image without the narrative outcome loop, so the gameplay loop is incomplete in [core/commands/games/tarot.js](core/commands/games/tarot.js#L111-L188).
- Noughts-and-Crosses has no timeout or forfeit path; if players walk away the `rawWS` listener persists and the game never closes in [core/commands/games/noughtsandcrosses.js](core/commands/games/noughtsandcrosses.js#L70-L195).
