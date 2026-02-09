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

---

### Round 2 — Non-marked issues (silent bugs, logic errors, bad practices)

**messageCreate.js — eval backdoor & stale code**
- [ ] **SECURITY**: Hardcoded `eval` backdoor on line 26 executes arbitrary code for 3 user IDs with zero logging, no guild restriction, and output leaks to the channel. Remove or gate behind a proper dev flag. See [eventHandlers/messageCreate.js](eventHandlers/messageCreate.js#L26-L35).
- [ ] Bot continues processing messages even when `PLX.ready` is falsy (the early-return is commented out on L8). Either restore the guard or remove the dead block. See [eventHandlers/messageCreate.js](eventHandlers/messageCreate.js#L6-L9).
- [ ] `delete require.cache` on every message when `PLX.refreshing` is true is a memory-churn risk under load. See [eventHandlers/messageCreate.js](eventHandlers/messageCreate.js#L18-L21).

**onEveryMessage.js — unbounded execQueue & dead code**
- [ ] `PLX.execQueue` grows each message by pushing `Drops(msg)` but only filters on `isFulfilled()`; settled-rejected promises remain forever → unbounded array growth / memory leak. See [core/subroutines/onEveryMessage.js](core/subroutines/onEveryMessage.js#L52-L53).
- [ ] `levelChecks` will always call `localLevelUp` even when `servData` is undefined (it only guards `globalLevelUp`); this causes `servData.modules` crash next call since the fallback DB fetch doesn't re-enter. See [core/subroutines/onEveryMessage.js](core/subroutines/onEveryMessage.js#L20-L29).
- [ ] Image-tracker block (L44-L48) has an empty `/* Do Stuff when there is image */` body — dead code path taking up CPU for the regex match. Remove or implement. See [core/subroutines/onEveryMessage.js](core/subroutines/onEveryMessage.js#L44-L48).

**onEveryCommand.js — logic inversion**
- [x] `commLog` condition `!message.author.id === process.env.WATCHCMD` is always `false` because `!string` is `false`, so watch-command logging never fires. Should be `message.author.id !== process.env.WATCHCMD`. See [core/subroutines/onEveryCommand.js](core/subroutines/onEveryCommand.js#L10).
- [ ] `saveStatistics` calls `Promise.all` but never returns or awaits the result — any DB error is silently swallowed. See [core/subroutines/onEveryCommand.js](core/subroutines/onEveryCommand.js#L23).

**CommandPreprocessor.js — operator-precedence & error-message concatenation**
- [x] Error message embed uses `knownError?.details ? ... : ''` but the `+` operator binds tighter than `?:`, so the ternary condition is actually `"Error Code: **…**" + knownError?.details` (always truthy) → the "known error" block is always shown with `undefined` when there's no known error. Needs parentheses. See [core/structures/CommandPreprocessor.js](core/structures/CommandPreprocessor.js#L246-L254).
- [ ] `command.disabled` check on L81 is inverted — it lets through staff users when `command.disabled` is true but blocks everyone else, meaning disabled commands are *only* accessible to staff (probably intended) but the emoji reaction suggests denial. Verify intent. See [core/structures/CommandPreprocessor.js](core/structures/CommandPreprocessor.js#L81).

**ComponentPaginator.js — variable name typo**
- [x] `interaction.ack().catch(e => console.log(err, "ERROR ACK…"))` references `err` instead of `e` → `ReferenceError` at runtime, swallowing the real error. See [core/structures/ComponentPaginator.js](core/structures/ComponentPaginator.js#L80).

**ComponentsHandler.js — implicit global `newButtons`**
- [x] `addButtons` assigns to bare `newButtons` without `let`/`const` → implicit global variable, causes race conditions when multiple messages add buttons concurrently. See [core/structures/ComponentsHandler.js](core/structures/ComponentsHandler.js#L75).
- [ ] `removeButtons` / `enableButtons` / `disableButtons` compare `currentComps === newComps` by reference after `.map()`, which always creates a new array, so the equality check is dead code (never short-circuits). See [core/structures/ComponentsHandler.js](core/structures/ComponentsHandler.js).
- [x] Left-over `console.log(newButtons)` in production path. See [core/structures/ComponentsHandler.js](core/structures/ComponentsHandler.js#L76).

**ButtonCollector.js — potential crash on DM interactions**
- [x] `checkListener` accesses `interaction.member.user.id` — in DMs `interaction.member` is `undefined` → crash. Guard with `interaction.member?.user?.id ?? interaction.user?.id`. See [core/structures/ButtonCollector.js](core/structures/ButtonCollector.js#L107).
- [ ] `awaitButtonClick` resolves with `{error:"timeout"}` (an object) on timeout, but call sites (like YesNo.js) check `responses?.length` — objects have no `.length` so timeout is treated as "no response" rather than an explicit error. Unify the contract. See [core/structures/ButtonCollector.js](core/structures/ButtonCollector.js#L91).

**Economy.js — undefined variable `currarr`**
- [x] `parseCurrencies` assigns to undefined `currarr` when `curr` is an array (`currarr = curr.map(...)`) instead of `curr = curr.map(...)` → the mapped result is lost, original array used untransformed. See [core/archetypes/Economy.js](core/archetypes/Economy.js#L158).
- [x] `new Error({ reason: "NO FUNDS" })` passes an object to `Error` constructor → error `.message` becomes `"[object Object]"`, useless for debugging. Use `new Error("NO FUNDS")`. See [core/archetypes/Economy.js](core/archetypes/Economy.js#L331).
- [x] `transactionId` uses `randomize(-1000,1000)` which can be negative, producing an invalid base-32 string. See [core/archetypes/Economy.js](core/archetypes/Economy.js#L256).

**Blackjack.js — `.concat()` result discarded**
- [x] `this.deck.concat(Blackjack._shuffle(DECK_TEMPLATE))` does not mutate `this.deck` — the concatenated result is thrown away, so multi-deck games always play with a single deck. Should be `this.deck = this.deck.concat(...)`. See [core/archetypes/Blackjack.js](core/archetypes/Blackjack.js#L37).
- [x] `this.decks.length` on L67 references `this.decks` (plural) which doesn't exist → `TypeError`. Should be `this.deck.length`. See [core/archetypes/Blackjack.js](core/archetypes/Blackjack.js#L67).
- [ ] Guild-shared `decks` Map is never cleaned up → memory leak for long-running processes. See [core/archetypes/Blackjack.js](core/archetypes/Blackjack.js#L1).
- [x] Infinite loop risk: `nojoker` option has `const incr = 0` that's never incremented, yet `incr > 5` is the break condition. See [core/archetypes/Blackjack.js](core/archetypes/Blackjack.js#L52-L55).

**Venture.js — `switch` on string equality always falls to default**
- [ ] `eventProcessor` switch-case uses `case "item" && supply.item.find(...)` which evaluates the `&&` first (producing `true`/`false`/object), so the case label is never the string `Criteria`. Every condition except `"rubines"` falls to `default: throw`. See [core/archetypes/Venture.js](core/archetypes/Venture.js#L89-L100).
- [ ] Undeclared loop variable `for (i in payQuery)` → implicit global `i`. See [core/archetypes/Venture.js](core/archetypes/Venture.js#L114).
- [ ] Constructor uses `time` and `i` as bare globals inside the while loop (`const time = i * TIME_SLICE + 5`), shadowing the constructor parameter and `for` index. See [core/archetypes/Venture.js](core/archetypes/Venture.js#L178-L179).

**Galleries.js — implicit global `Url`**
- [x] `randomOneIndexed` and `indexedOne` assign to bare `Url` without `let`/`const` → implicit global, race-condition prone. See [core/structures/Galleries.js](core/structures/Galleries.js#L22).

**globalLevelUp.js — level-milestone modulo is inverted**
- [x] `levelUpPrizeMail` uses `level % 25` etc. as switch cases, but non-zero modulo is truthy — so `level % 25` is true for every level *except* multiples of 25. The first case that's truthy wins, meaning almost all levels get "UR" instead of "C". Needs `level % 25 === 0`. See [core/subroutines/globalLevelUp.js](core/subroutines/globalLevelUp.js#L19-L24).
- [x] `commitLevel` is called *before* the `curLevelG > userData.modules.level` check, so the level is overwritten even on non-level-up messages, losing the ability to detect the transition correctly if there's clock skew or reordering. See [core/subroutines/globalLevelUp.js](core/subroutines/globalLevelUp.js#L40-L41).

**guildMemberAdd.js / guildMemberRemove.js — null dereference on missing user data**
- [ ] Both handlers access `userData.modules.*` and `member.user.username` etc. without guarding `userData` or `member.user` being null. If the user isn't in DB yet, the template replacements crash. See [eventHandlers/guildMemberAdd.js](eventHandlers/guildMemberAdd.js) and [eventHandlers/guildMemberRemove.js](eventHandlers/guildMemberRemove.js).
- [ ] `guildMemberRemove.js` L37: `true || svData.modules.GREET.image` always evaluates to `true`, so the image setting is ignored — looks like a leftover debug override. See [eventHandlers/guildMemberRemove.js](eventHandlers/guildMemberRemove.js#L37).
- [ ] `.catch(err=>null)` at the bottom silently eats all errors including real programming bugs. See both files.

**guildMemberRemove.js — wrong module referenced**
- [ ] L37 references `svData.modules.GREET.image` but this is the *farewell* handler — should be `svData.modules.FWELL.image`. See [eventHandlers/guildMemberRemove.js](eventHandlers/guildMemberRemove.js#L37).

**cronjobs.js — ONE_HOUR cron never started separately**
- [ ] `ONE_HOUR` is created with no `start: true` flag and `.start()` is called below, but the cron body is empty — wasted timer. Either populate or remove. See [core/subroutines/cronjobs.js](core/subroutines/cronjobs.js#L34).
- [ ] `FIFTEEN_MINUTE` cron is created but `.start()` is never called with `true` init flag and the try/catch inside wraps commented-out code — the `Feeds.check()` call above it is unprotected. See [core/subroutines/cronjobs.js](core/subroutines/cronjobs.js#L49-L62).
- [ ] `FIVE_MINUTES` iterates all guilds with `forEach(async ...)` — the async callback return value is ignored and exceptions are unhandled. See [core/subroutines/cronjobs.js](core/subroutines/cronjobs.js#L29-L33).

**Roulette.js — `games` Map never cleaned on guild leave**
- [ ] Guild Roulette games stored in module-level `games` Map are never evicted if the guild is removed or the game is abandoned without `.end()`. See [core/archetypes/Roulette.js](core/archetypes/Roulette.js).

**Lootbox.js — `delete this.compileVisuals` antipattern**
- [ ] Inside the Promise constructor, `delete this.compileVisuals` removes the property while other code might still be awaiting it. Race-prone. See [core/archetypes/Lootbox.js](core/archetypes/Lootbox.js#L72).

**SelfAPI.js — `Object.assign` from axios instance**
- [ ] `Object.assign(this, axios.create(...))` copies axios instance methods onto `SelfAPI` but loses the prototype chain — interceptors and internal state won't work correctly. Prefer composition (`this.client = axios.create(...)`) over mixin. See [core/utilities/SelfAPI.js](core/utilities/SelfAPI.js#L7-L12).

**UtilityGearbox.js — `this` in module scope**
- [x] `RichEmbed: this.Embed` at module top-level: `this` is the module's `exports` object, and `this.Embed` hasn't been assigned yet at that point → `RichEmbed` is always `undefined`. See [core/structures/UtilityGearbox.js](core/structures/UtilityGearbox.js#L6).

**messageComponent.js — silent catch swallows all errors**
- [ ] The `try/catch` around the dynamic `require` has an empty catch body — if a valid interaction handler throws, the error is silently eaten with no logging or user feedback. See [eventHandlers/messageComponent.js](eventHandlers/messageComponent.js#L8).

**Progression.js — spent event returns immediately**
- [x] The `"spend"` listener starts with `return;` (L65), so no spend-based quest tracking ever runs. Probably left from debugging. See [core/archetypes/Progression.js](core/archetypes/Progression.js#L65).

**WebhookDigester.js — API inconsistency**
- [ ] `info()`, `warn()`, `error()`, `ok()` pass a 2nd positional arg as `options`, but `execute()` expects `options.hook` etc. Meanwhile `raw()` destructures `options` differently. If callers pass `(message, errStack, opts)` (3 args, as in `INSTR.error(…)`) the options object is silently dropped. See [utils/WebhookDigester.js](utils/WebhookDigester.js).

---

### 1.5.102
- 🐛 Fix ComponentPaginator ack error handler variable name.
- 🧹 Remove implicit global `newButtons` and noisy log in `addButtons`.
- 🛡️ Guard component collector user ID resolution for DMs.
- 🐛 Fix currency array normalization in `Economy.parseCurrencies`.
- 🧹 Fix `RichEmbed` export in UtilityGearbox.
- 🐛 Fix known error details concatenation in command error embed.
- 🐛 Fix watch-command logging condition.
- 🐛 Use proper NO FUNDS error message in economy transfers.
- 🐛 Make economy transaction IDs non-negative.
- 🐛 Fix level-up milestone rewards logic.
- 🐛 Fix global level-up detection order.
- 🐛 Fix blackjack multi-deck composition and card count.
- 🐛 Fix blackjack no-joker loop guard.
- 🛡️ Restore spend quest tracking in progression.
- 🛡️ Guard quest completion and quest lookup in progression.
- 🧹 Gate noisy progression logs behind log level.
- 🐛 Fix progression setImmediate usage for quest updates.
