# Bot Audit Action Items

Date: 2026-02-08

Scope reviewed:
- [pollux.js](pollux.js)
- [sidecar.js](sidecar.js)
- [core/structures/ReactionCollector.js](core/structures/ReactionCollector.js)
- [core/structures/ButtonCollector.js](core/structures/ButtonCollector.js)
- [core/archetypes/GuessingGames.js](core/archetypes/GuessingGames.js)
- [core/commands/moderation/switch.js](core/commands/moderation/switch.js)
- [core/archetypes/Crafter.js](core/archetypes/Crafter.js)
- TODO/FIXME markers surfaced in bot source code (core/, commands/, utils/, types/)

## Action items

### TODO/FIXME markers to triage
- [ ] FIXME: `MiscUtils` appears unused; remove or wire it. See [core/utilities/MiscUtils.js](core/utilities/MiscUtils.js).
- [ ] FIXME: DB pooling on every message in box drops. See [core/subroutines/boxDrops.js](core/subroutines/boxDrops.js).
- [ ] FIXME: Achievements USER/ACHIEVEMENT ordering consistency. See [core/archetypes/Achievements.js](core/archetypes/Achievements.js).
- [ ] FIXME: remove temporary switch in achievements logic. See [core/archetypes/Achievements.js](core/archetypes/Achievements.js).
- [ ] TODO: improve achievement output formatting. See [core/archetypes/Achievements.js](core/archetypes/Achievements.js).
- [ ] TODO: refactor `Economy` method params into options object. See [core/archetypes/Economy.js](core/archetypes/Economy.js).
- [ ] TODO: formalize currency conversion mapping. See [core/archetypes/Economy.js](core/archetypes/Economy.js).
- [ ] TODO: constants for level curve. See [core/subroutines/globalLevelUp.js](core/subroutines/globalLevelUp.js).
- [ ] TODO: document string color types and clarify `piggyback`. See [types/global.d.ts](types/global.d.ts).
- [ ] FIXME: clarify `LootboxItem` query type (object vs array). See [core/archetypes/LootboxItem.js](core/archetypes/LootboxItem.js).
- [ ] FIXME: add a clean way to disable `WebhookDigester`. See [utils/WebhookDigester.js](utils/WebhookDigester.js).
- [ ] TODO: add error messages to Morse command. See [core/commands/sound/morse.js](core/commands/sound/morse.js).
- [ ] FIXME: replace placeholder logic in Premium module. See [core/archetypes/Premium.js](core/archetypes/Premium.js).
- [ ] TODO: use dashboard API for divorce flow. See [core/commands/social/divorce.js](core/commands/social/divorce.js).
- [ ] TODO: clean Math.abs usage in commend and replace constants. See [core/commands/social/commend.js](core/commands/social/commend.js).
- [ ] FIXME: `Switch` guild creation returns void? confirm and fix. See [core/archetypes/Switch.js](core/archetypes/Switch.js).
- [ ] FIXME: `ping` may show negative if clocks are out of sync; add guard. See [core/commands/infra/ping.js](core/commands/infra/ping.js).
- [ ] TODO: add internal services list to `ping`. See [core/commands/infra/ping.js](core/commands/infra/ping.js).
- [ ] FIXME: `clear` moderation command needs fix. See [core/commands/moderation/clear.js](core/commands/moderation/clear.js).
- [ ] FIXME: `exchange` route leads nowhere. See [core/structures/UsageHelper.js](core/structures/UsageHelper.js).
- [ ] FIXME: handle relationship without `userdata` in `kiss`. See [core/commands/img/kiss.js](core/commands/img/kiss.js).
- [ ] FIXME: delete post-migration commands (`claimtokens`, `inventmigrate`, `migfix`, `migrate`, `mrgt`). See [core/commands/misc/claimtokens.js](core/commands/misc/claimtokens.js), [core/commands/misc/inventmigrate.js](core/commands/misc/inventmigrate.js), [core/commands/infra/migfix.js](core/commands/infra/migfix.js), [core/commands/infra/migrate.js](core/commands/infra/migrate.js), [core/commands/misc/mrgt.js](core/commands/misc/mrgt.js).
- [ ] TODO: add proper localization to `joined`. See [core/commands/utility/joined.js](core/commands/utility/joined.js).
- [ ] TODO: replace constants in `daily`. See [core/commands/economy/daily.js](core/commands/economy/daily.js).
- [ ] FIXME: remove “in” from daily locale string. See [core/commands/economy/daily.js](core/commands/economy/daily.js).
- [ ] TODO: address `@ts-ignore` notes in daily. See [core/commands/economy/daily.js](core/commands/economy/daily.js).
- [ ] TODO: deprecate Request and Cheerio usage in rotation. See [core/commands/utility/rotation.js](core/commands/utility/rotation.js).
- [ ] TODO: finalize exchange command behavior (Discoin not on launch). See [core/commands/economy/exchange.js](core/commands/economy/exchange.js).
- [ ] FIXME: resolve unknown interaction/message in noughts and crosses. See [core/commands/games/noughtsandcrosses.js](core/commands/games/noughtsandcrosses.js).
- [ ] TODO: add language support and ranks for Hangmaid. See [core/commands/games/hangmaid/index.js](core/commands/games/hangmaid/index.js).
- [ ] TODO: implement success message and finish givebox QoL. See [core/commands/economy/givebox.js](core/commands/economy/givebox.js).
- [ ] TODO: flesh out `local$` command. See [core/commands/economy/local$.js](core/commands/economy/local$.js).
- [ ] FIXME: Russian roulette strings/sound; add easter egg later. See [core/commands/games/russianroulette.js](core/commands/games/russianroulette.js).
- [ ] TODO: replace constants in transfer. See [core/commands/economy/transfer.js](core/commands/economy/transfer.js).
- [ ] TODO: flesh out tarot command (luck system). See [core/commands/games/tarot.js](core/commands/games/tarot.js).
- [ ] TODO: add better rate limiting for whatanime. See [core/commands/anime/whatanime.js](core/commands/anime/whatanime.js).
- [ ] TODO: complete fragment command (depends on synth). See [core/commands/cosmetics/fragment.js](core/commands/cosmetics/fragment.js).
- [ ] TODO: Twitch alert flow improvements (custom strings, deletion messaging, live state, utility extraction, id/login checks). See [core/commands/utility/twitchalert.js](core/commands/utility/twitchalert.js).
- [ ] FIXME: avoid hard-coded link in weather command. See [core/commands/utility/weather.js](core/commands/utility/weather.js).
- [ ] TODO: deprecate or finish medalinfo. See [core/commands/cosmetics/medalinfo.js](core/commands/cosmetics/medalinfo.js).
- [ ] TODO: polish trivia. See [core/commands/fun/trivia/index.js](core/commands/fun/trivia/index.js).
- [ ] TODO: add emojis and save adventure to DB. See [core/commands/pollux/adventure.js](core/commands/pollux/adventure.js).
- [ ] TODO: finish venture processor and third island in adventure. See [core/commands/pollux/adventure.js](core/commands/pollux/adventure.js).
- [ ] TODO: map airline route options. See [core/commands/games/airline/routes/new.js](core/commands/games/airline/routes/new.js).
- [ ] TODO: add select UI to read command. See [core/commands/utility/read.js](core/commands/utility/read.js).
- [ ] TODO: update Twitch feed display name and share axios helper. See [core/subroutines/feeds/twitch.js](core/subroutines/feeds/twitch.js).
- [ ] TODO: address RSS/Bluebird timeout handling. See [core/subroutines/feeds/rss.js](core/subroutines/feeds/rss.js).
- [ ] TODO: update YouTube feed handler (ts-expect-error, RSS handling). See [core/subroutines/feeds/youtube.js](core/subroutines/feeds/youtube.js).
- [ ] TODO: move `_consts` into constants module. See [core/subroutines/_consts.js](core/subroutines/_consts.js).
- [ ] FIXME: booster packs not added in lootbox generator. See [core/commands/cosmetics/lootbox_generator.js](core/commands/cosmetics/lootbox_generator.js).
- [ ] FIXME: `NameColor` appears unused; remove or wire it. See [core/structures/NameColor.js](core/structures/NameColor.js).

### Deeper findings (memory leaks, bad practices, uncaught exceptions, bugs)
- [ ] Fix `createMessage` override to preserve `this` context and guard DMs where `permissionsOf` is unavailable. See [pollux.js](pollux.js).
- [ ] Align blacklist property naming (`blackListedUsers` vs `blacklistedUsers`) to avoid stale reads. See [pollux.js](pollux.js).
- [ ] Harden crash handlers: `uncaughtException` uses `err.slice` which fails for Error objects; use `err.stack` or `String(err)`. See [pollux.js](pollux.js).
- [ ] Wrap cron callbacks in try/catch to prevent unhandled rejections from crashing the sidecar. See [sidecar.js](sidecar.js).
- [ ] Clamp negative timeout delays in sidecar timers (`expires - Date.now()`), otherwise large backlogs can flood the event loop. See [sidecar.js](sidecar.js).
- [ ] Avoid implicit global `Promise` reassignment; use `const Promise = ...` to prevent unexpected library behavior. See [sidecar.js](sidecar.js).
- [ ] Clear `setTimeout` handles on collector stop to avoid lingering references and leaks. See [core/structures/ReactionCollector.js](core/structures/ReactionCollector.js) and [core/structures/ButtonCollector.js](core/structures/ButtonCollector.js).
- [ ] Guard `interaction.member` access in button collector; use `interaction.user` when missing to avoid runtime errors. See [core/structures/ButtonCollector.js](core/structures/ButtonCollector.js).
- [ ] Fix normal-mode guessing game end handler using undefined `m`; should use `msg` and avoid chaining on promise return. See [core/archetypes/GuessingGames.js](core/archetypes/GuessingGames.js).
- [ ] Replace `Collector.end` with `Collector.stop` if the collector API doesn’t expose `end`, and ensure cleanup paths always clear intervals. See [core/archetypes/GuessingGames.js](core/archetypes/GuessingGames.js).
- [ ] Remove reaction-remove listeners from `listeners` map on exit to prevent leaks and stale handlers. See [core/commands/moderation/switch.js](core/commands/moderation/switch.js).
- [ ] Reset cached item maps on periodic reload or handle deleted items to avoid stale craft data. See [core/archetypes/Crafter.js](core/archetypes/Crafter.js).
- [ ] Add error handling around periodic `init()` refresh to avoid unhandled rejections. See [core/archetypes/Crafter.js](core/archetypes/Crafter.js).
