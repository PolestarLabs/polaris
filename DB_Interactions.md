# Database Interactions

This document enumerates every place in the bot codebase where the database is read from or written to.  The goal is to replace each of these with an equivalent API call when migrating to the new architecture.

> **Note:** at the time of writing the bot accesses the database indirectly via the `DB`/`vDB` connection objects returned by `@polestarlabs/database_schema`.  Most read/write operations live in helper modules, subroutines, or command files (see `core/`) and are performed through shared packages under `node_modules`.  The only **direct** `DB.` call inside this repository is the blacklist fallback in `pollux.js`; every other interaction occurs in the modules listed below.  For migration, each of these must be replaced by the appropriate dashboard API endpoint.

> The “Legacy API doable?” column indicates whether the existing monolithic dashboard already exposes the required data/actions; if not it will need new routes.  “Elysia API doable?” marks whether the new backend can provide the same functionality (always yes in principle).

---

## Summary table by file

| File | Collection(s) | Operations | Read/Write | Legacy API doable? | Elysia API doable? |
|------|---------------|------------|------------|--------------------|--------------------|
| `pollux.js` | users, servers | `find({blacklisted})` (fallback) | Read | ✅ yes (/system/blacklisted/*) | ✅ yes |
| `sidecar.js` | temproles, mutes, feed, servers | `.find`, `.lean`, `.remove`, `.expire`, `.updateOne`, `.deleteOne` | R/W | ❓ mostly no – cron utilities, needs new endpoints or internal service | ✅ yes |
| `core/archetypes/Progression.js` | users, quests | `set`, `findOne`, `updateOne` | R/W | ❓ partial (progression endpoints exist?) | ✅ yes |
| `core/archetypes/Premium.js` | users, userInventory | `set`, `bulkWrite`, `get` | R/W | ❓ | ✅ yes |
| `core/archetypes/Redeem.js` | promocodes, users, cosmetics, audits | `findOne`, `updateOne`, `new`, `get` | R/W | ❓ | ✅ yes |
| `core/archetypes/Switch.js` | servers, channels | `get`, `new`, `set` | R/W | ❓ | ✅ yes |
| `core/archetypes/UserProfileModel.js` | users, localranks, relationships | `get`, `findOne` | R | ✅ likely read | ✅ yes |
| `core/archetypes/Venture.js` | advLocations, advJourneys | `findOne`, `traceRoutes`, `find`, `countDocuments` | R | ❓ | ✅ yes |
| various `core/commands/...` | many (users, userInventory, cosmetics, items, marketplace, audits, responses, etc.) | reads (`get`, `find`, `findOne`, `getFull`) and writes (`set`, `new`, `updateOne`, `remove`, `bulkWrite`, `collection.insert`, `deleteOne`, `push`, `pull`) | R/W | most reads are served by existing endpoints; most writes will require additional routes per domain (economy, cosmetics, etc.) | ✅ yes |
| `core/commands/infra/*` | users, vDB.users, servers, audits, etc. | both | R/W | ❓ (migration utilities likely no) | ✅ yes |
| `core/commands/games/*` | users, cosmetics, userInventory, rankings | both | ❓ | ✅ yes |
| `core/commands/cosmetics/*` | users, userInventory, cosmetics, items | both | ✅ many reads exist; writes need API | ✅ yes |
| `core/commands/economy/*` | users, userInventory, audits, marketplace, items, etc. | both | ❓ | ✅ yes |
| `core/commands/fun/responses.js` | responses | `findOne`, `set`, `new` | R/W | ❓ | ✅ yes |
| ... (hundreds of other command files) | see grep output | see individual lines above | R/W | depends on collection | ✅ yes |

> **Note:** the table above is a condensed view. The full list of interactions (by file and line) is captured in the grep output used to compile this summary; each occurrence will need to be migrated individually.

---

## Per‑file breakdown

### pollux.js

#### **Reads**

| Operation | Used for | Overload | Remarks | Suggested endpoint |
|---|---|---|---|---|
| `DB.users.find({blacklisted:true})` | fallback blacklist check | 1 | replace with HTTP API; only direct call | GET `/system/blacklisted/:user` (R1) |

### sidecar.js

#### **Reads / Writes**

| Operation | Used for | Overload | Remarks | Suggested endpoint |
|---|---|---|---|---|
| `DB.temproles.find/expire/remove` | temp role cron cleanup | many | heavy scheduled job, consider internal API | GET/DELETE `/cron/temproles` (R2/W1) |
| `DB.mutes.updateOne/deleteOne` | mute expirations | several | map to `/moderation/mutes` | PATCH/DELETE `/moderation/mutes/:id` (W2) |
| `DB.feed.*` | feed maintenance | various | internal use; may not expose publicly | – |
| `DB.servers.updateOne` | server settings sync | 1 | covered by server API | PATCH `/servers/:id` (R3/W3) |

### core/archetypes/Progression.js

#### **Reads / Writes**

| Operation | Used for | Overload | Remarks | Suggested endpoint |
|---|---|---|---|---|
| `DB.userQuests` / `DB.users` (legacy) | user quests/progression state stored separately | ~10 per call | split into GET/PATCH `/users/:id/progression` | GET `/users/:id/progression` (R4), PATCH `/users/:id/progression` (W4) |
| `DB.quests.find` / `DB.quests.get` | list and fetch quests | many | static data; cache in API | GET `/quests` (R5), GET `/quests/:id` (R6) |

### core/archetypes/Premium.js

#### **Reads / Writes**

| Operation | Used for | Overload | Remarks | Suggested endpoint |
|---|---|---|---|---|
| `DB.users.set/get` | premium flags | small | map to `/users/:id/premium` | PUT `/users/:id/premium` (W5), GET `/users/:id/premium` (R7) |
| `DB.userInventory.bulkWrite` | inventory changes | occasional | batch via `/users/:id/inventory/actions` | POST `/users/:id/inventory/actions` (W6) |
| `DB.cosmetics.find` | catalogue | 2 | static cacheable | GET `/cosmetics?group=plx_collection` (R8) |

### core/archetypes/Redeem.js

#### **Reads / Writes**

| Operation | Used for | Overload | Remarks | Suggested endpoint |
|---|---|---|---|---|
| `DB.promocodes.findOne/updateOne` | redeem logic | 3 | transaction; POST `/promocodes/redeem` | POST `/promocodes/redeem` (W7) |
| `DB.users.get/getFull` | fetch redeemer | 2 | reuse user endpoints | GET `/users/:id` (R9) |
| `DB.cosmetics.get` | resolve prize | 1 | `/cosmetics/:id` | GET `/cosmetics/:id` (R10) |
| `DB.audits.new` | audit log | 1 | `/audits` | POST `/audits` (W8) |

### core/archetypes/Switch.js

#### **Reads / Writes**

| Operation | Used for | Overload | Remarks | Suggested endpoint |
|---|---|---|---|---|
| `DB.servers.get/set` | server switch state | 2 | GET/PUT `/servers/:id/switch` | GET `/servers/:id/switch` (R11), PUT `/servers/:id/switch` (W9) |
| `DB.channels.get/new/set` | channel switches | 3 | `/servers/:i…/channels/:cid/switch` | GET `/servers/:id/channels/:cid/switch` (R12), PUT `/servers/:id/channels/:cid/switch` (W10) |

### core/archetypes/UserProfileModel.js

#### **Reads**

| Operation | Used for | Overload | Remarks | Suggested endpoint |
|---|---|---|---|---|
| `DB.users.*` | base user data | several | from `/users/:id` | GET `/users/:id` (R13) |
| `DB.commends.parseFull(this.ID)` | commend totals | 1 | `/users/:id/commends` | |
| `DB.localranks.get({user,server})` + count | compute thx & rank | 2 | expensive; aggregate in API | GET `/users/:id/localrank?server=:sid` (R15) |
| `DB.relationships.findOne` | marriage status | 1 | `/relationships?type=marriage&user=:id` | |

### core/archetypes/Venture.js

#### **Reads**

| Operation | Used for | Overload | Remarks | Suggested endpoint |
|---|---|---|---|---|
| `DB.advLocations.findOne/traceRoutes/find` | location graph | ~3 | heavy; consider microservice | GET `/adventure/locations/:id/routes` (R17) |
| `DB.advJourneys.countDocuments` | occupancy count | 1 | cacheable | GET `/adventure/locations/:id/occupancy` (R18) |

### core/commands/* (summary)

#### **Patterns**

| Operation types | Collections | Remarks | Suggested endpoint families |
|---|---|---|---|
| reads (`get`, `find`, `findOne`, `getFull`) | users, cosmetics, items, marketplace, audits, etc. | most already covered by legacy API | `/users` (R19), `/cosmetics` (R20), `/marketplace` (R21), … |
| writes (`set`, `new`, `updateOne`, …) | economy, social, games, etc. | generally require new POST/PATCH/DELETE routes | `/economy` (W11), `/social` (W12), `/games` (W13) etc. |

> Individual command files should be rewritten to call the appropriate API endpoints using the generated client (`PLX.api…`).

---

## Domain‑specific tables

### Economy commands

#### `balance.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.users.get`, `DB.userInventory.get` | fetch target balance and inventory | 2 | consolidate into single call | GET `/economy/balance/:user` (R22) |
| `DB.audits.find(...).sort().limit()` | recent transactions | 1 | could be  `/audits?user=:id&limit=5` | GET `/audits?user=:id&limit=5` (R23) |

#### `daily.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.users.getFull` | user data for daily reward | 1 | use `/users/:id` | GET `/users/:id` (R24) |
| `DB.items.find` | select boosterpacks | 1 | static lookup; cache | GET `/items?type=boosterpack&rarity=in(C,U,R)` (R25) |

#### `givebox.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.users.get`, `getFull` | author and target verification | 2 | already in user API | GET `/users/:id` (R26) |
| `DB.items.find` | box catalogue | 1 | `/items?type=box` | GET `/items?type=box` (R27) |

#### `local$.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.audits.new` | record conversion | 2 | POST `/audits` (already W8) | POST `/audits` (W8) |

#### marketplace sub‑commands

| File | Operations | Purpose | Endpoint |
|------|------------|---------|----------|
| delete.js | `DB.marketplace.get`, `DB.marketbase`, `DB.marketplace.remove` | remove listing | GET `/marketplace/:id` (R28)<br>DELETE `/marketplace/:id` (W14) |
| list.js | `DB.marketbase`, `DB.marketplace.find` | list offers | GET `/marketplace` (R29) |
| post.js | `DB.users.getFull`, `DB.userInventory.getFull`, `DB.items.findOne`, `DB.cosmetics.findOne` | create listing | POST `/marketplace` (W15) |

#### `transfer.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.users.get` | sender/recipient lookup | 2 | GET `/users/:id` (R30) |

### Social commands

*(only a representative subset is shown; many commands follow the same pattern)*

#### `buyrole.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.paidroles.find` | fetch server role market | 1 | GET `/servers/:id/paidroles` (R31) |
| `DB.users.get` | buyer lookup | 1 | GET `/users/:id` (R32) |
| `DB.temproles.add` | assign temporary role | 1 | POST `/servers/:id/temproles` (W16) |

#### `commend.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.users.findOne`, `DB.userInventory.getFull` | author data | 2 | use `/users/:id` and inventory API | GET `/users/:id` (R33) |
| `DB.commends.parseFull` | fetch target commends | many | GET `/users/:id/commends` (R34) |
| `DB.commends.add` | record commend | 1 | POST `/commends` (W17) |
| `DB.users` (meta lookup) | owner metas | 1 | reuse user API | R35 |

#### `divorce.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.relationships.find` / `findByIdAndDelete` | read/delete marriages | several | GET/DELETE `/relationships/:id` (R36/W18) |
| `DB.users.getFull` | user tags | 2 | GET `/users/:id` (R37) |

#### `gift` sub‑commands

| File | Operations | Purpose | Endpoint |
|------|------------|---------|----------|
| give.js | `DB.gifts.find`, `updateOne` | send gift | GET `/gifts?holder=:id` (R38) / PATCH `/gifts/:id` (W19) |
| inventory.js | `DB.gifts.find` | view inventory | GET `/gifts?holder=:id` (R38) |
| open.js | `DB.gifts.find`, `DB.users.get`, `DB.cosmetics.get`,`DB.gifts.remove`,`DB.users.set` | open gift | POST `/gifts/:id/open` (W20) |
| peek.js | `DB.gifts.find`, `DB.users.get` | peek at gifts | reuse endpoints R38/R32 |
| wrap.js | `DB.users.getFull`, `DB.users.set`, `DB.gifts.set` | wrap gift | POST `/gifts` (W21), PATCH `/users/:id` (W22) |

#### `leaderboards.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.users.find` / `DB.localranks.find` | compute leaderboards | many | use leaderboard API | GET `/leaderboards` (R39) |
| `DB.localranks.get` | self rank | 1 | GET `/users/:id/localrank` (R15) |
| `DB.users.find` (count) | server‑wide rank count | 1 | aggregate endpoint | R40 |

<!-- additional social command tables would follow similar format -->

### Games commands

#### `airline/new.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.airlines.AIRPORT.find` / `AIRPLANES.find` | starter options | 2 | GET `/games/airline/airports?starter=true` (R41) |
| `DB.airlines.AIRLINES.findOne` | check existing airline | 1 | GET `/games/airline/:id` (R42) |

#### `airline/routes/new.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.airlines.AIRPORT.findOne` | lookup port | 1 | GET `/games/airline/airports/:iata` (R43) |

#### `betflip.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.users.get` | fetch gambler | 1 | R9 |

#### `blackjack.js`

| Operation | Purpose | Overload | Remarks | Endpoint |
|-----------|---------|----------|---------|----------|
| `DB.users.get`, `DB.userInventory.get` | player data | 2 | R9 / R10 |
| `DB.users.set` | change skin | 2 | PATCH `/users/:id` (W23) |
| `DB.cosmetics.find` | deck skins | 1 | R8 |

#### ranking/score files

| File | Operation | Purpose | Endpoint |
|------|-----------|---------|----------|
| guessflag.js, highscores/* | `DB.rankings.find` / `.collection.insert` | record or fetch scores | GET `/rankings` (R44), POST `/rankings` (W24) |


---

## Detailed scan results
---

## Detailed scan results

## Detailed scan results

The grep run produced the following hits inside the `bot/` tree (lines truncated for brevity):

```
core/archetypes/Premium.js: ... DB.users.set ...
core/archetypes/Progression.js: ... DB.users.findOne ... DB.users.updateOne ... DB.quests.find ...
core/archetypes/Redeem.js: ... DB.promocodes.findOne/updateOne ... DB.users.getFull ... DB.cosmetics.get ... DB.audits.new ...
core/archetypes/Switch.js: ... DB.servers.get ... DB.channels.get/new ... DB.servers.set ... DB.channels.set ...
core/archetypes/UserProfileModel.js: ... DB.users ... DB.localranks.get ... DB.relationships.findOne ...
core/archetypes/Venture.js: ... DB.advLocations.findOne/traceRoutes/find ... DB.advJourneys.countDocuments ...
core/commands/beta/debug.js: DB.users.set/findOne ...
core/commands/beta/vdiff.js: DB.users.findOne/noCache ... DB.userInventory.get ...
core/commands/cosmetics/*: many reads/writes of users, userInventory, cosmetics, items ...
core/commands/economy/*: reads/writes of users, audits, items, marketplace ...
core/commands/games/*: reads/writes of users, cosmetics, rankings ...
core/commands/img/kiss.js: DB.users.findOne ... DB.relationships.find ... DB.relationships.set ...
core/commands/infra/migfix.js, migrate.js, prime.js, status.js, transactionlookup.js: heavy DB usage
core/commands/inventory/*: reads/writes of cosmetics and inventories
core/commands/* (all remaining commands) likely include at least one DB operation; inspect per file.
-sidecar.js cron jobs: DB.temproles, DB.mutes, DB.feed
-pollux.js: blacklist query
```

*(see earlier grep output for the complete raw list which can be re-run with `grep -R "DB\."` inside `bot/`)*

---

## Migration considerations

1. **Automated extraction:** a simple script can parse the grep output to generate a precise CSV/bullets if required.
2. **Legacy API coverage:** most *read* operations correspond to endpoints already consumed by the dashboard; these can remain unchanged or be proxied. *Write* operations (user updates, marketplace actions, game progress, etc.) generally have no existing HTTP endpoint, so new POST/PUT/DELETE routes must be designed in the legacy and/or Elysia API. Use collection names as a guide for resource naming.
3. **Elysia API feasibility:** the new backend can expose any data structure needed; design the endpoints during refactor. Use @elysiajs/eden to generate types for the frontend and bot.
4. **Bot modifications:** each `DB.*` call in the bot code will be replaced by an HTTP client request (e.g. `PLX.api.get(…)` or `PLX.api.post(…)`) matching the new endpoint names. A wrapper library may abstract the translation.

---
## Detailed read operations


## Detailed write operations

---

*This document IS NOT COMPLETE. everything below this line MUST be deleted once completed. while this section below remains in the file, it is not considered complete. put additional tables above for each file separated by domain logic* 

\n\n
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:4:let ACHIEVEMENTS = DB.achievements.find({}).noCache().lean().then(a => ACHIEVEMENTS = a);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:15:    await DB.achievements.award(user, achievement);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:24:    //  return !!(await DB.progression.get({achievement,user,type:'achievement'})).awarded;
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:59:      if ((!userData?.modules && userData.id) || typeof userData === "string") userData = await DB.users.findOne({ id: userData.id || userData }).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:62:      const statistics = (await DB.control.findOne({ id: userData.id }).noCache())?.data?.statistics;
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:137:    const userData = await DB.users.get(uID);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:6:    this.airline = DB.airlines.AIRLINES.findOne({ id });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:11:    const airportData = await DB.airlines.AIRPORT.findOne({ id: airport });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:14:    await DB.airlines.SLOTS.validate((await (this.airline)).id, airportData.id).then(ok=>{
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:26:    const airplaneData = await DB.airlines.AIRPLANES.findOne({ id });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:30:      return DB.airlines.AIRPLANES.buy((await this.airline).id, airplaneData.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:43:    return DB.airlines.ROUTES.shutdown(route);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:12:  return DB.items.find({}).lean().then((ALLITEMS) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:94:      DB.users.getFull({ id: userid }),
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:95:      DB.users.get(userid),
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:96:      DB.userInventory.get(userid),
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:477:    let initialItems = await DB.items.find({
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:205:  return DB.users.get(uID).then((  /** @type { { currency: {[K in Currency]:number} } | null } */ userData) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:400: * NOTE: this will immediately end up in DB.
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Inventory.js:10:      DB.items.find({ type: this.invType }).lean().exec().then((boxes) => resolve(boxes));
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Inventory.js:14:  getUserData() { return DB.users.get(this.userID); }
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:312:const PREMIUM_STICKERS = DB.cosmetics.find({ public: true, GROUP: "plx_collection" }).noCache()
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:314:const PREMIUM_PACKS = DB.items.find({ type: "boosterpack", filter: "plx_collection" }).noCache()
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:391:  const userData = (await DB.users.findOne({ id: mansionMember.id }).noCache())?._doc;
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:458:  const userData = await DB.users.findOne({ id: userID }).noCache();
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:459:  const cosmeticsData = await DB.userInventory.get(userID);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:514:  // cosmetics ops (inventory, flairs, medals) go to DB.userInventory separately
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:711:  const usr = await DB.users.get(userID);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:125:        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; //this.userQuestsCache.get(userID);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:127:            const userData = await DB.users.findOne({ id: userID }).noCache().lean() || [];
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:202:        let quest = await DB.quests.get(questID);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:211:        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; // this.userQuestsCache.get(userID) || [];
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:218:        const userData = await DB.users.findOne({ id: userID }).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:223:        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; //this.userQuestsCache.get(userID) || [];
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:230:        const userData = await DB.users.findOne({ id: userID }).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:232:        return (await DB.quests.find({ public: true, reveal_level: { $lte: userData.progression.level } }).lean());
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:300:    const quest = await DB.quests.get(userQuest.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:301:    const currentUserQuests = (await DB.users.findOne({ id: userID }, { quest: 1 }).noCache())?.quests || [];
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:11:    this.data = await DB.promocodes.findOne({ code: this.code }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:160:      let redata = await DB.promocodes.findOne({ code }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:169:    const userData = await DB.users.getFull(this.user);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:180:      const prizeItem = DB.cosmetics.get( Object.assign({
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:143:      DB.servers.get(this._guild.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:144:      DB.channels.get(this._channel.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:53:    return DB.users
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:63:      DB.commends.parseFull(this.ID)
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:79:      return DB.localranks.get({ user: this.ID, server: this.server }).then(async (svRankData) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:81:        this.localRank = await DB.localranks
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:91:      let marriage = this.marriage || await DB.relationships.findOne({ type: "marriage", _id: this.featMarriage });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Venture.js:227:    const LOC = await DB.advLocations.findOne({ id: location }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Venture.js:229:    const NEI = await DB.advLocations.traceRoutes(location, 0);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Venture.js:230:    const LOCS = await DB.advLocations.find({ id: { $in: NEI.map((x) => x._id) } }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Venture.js:256:    const playerCount = await DB.advJourneys.countDocuments({ location, end: { $gt: Date.now() } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:36:    DB.users.findOne({ id: msg.author.id }).then((x) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:46:    DB.users.findOne({ id: msg.author.id }).then((x) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/vdiff.js:4:        DB.users.findOne({ id: msg.author.id }).noCache(),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/vdiff.js:5:        DB.userInventory.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/vdiff.js:8:    const vanillaUserData = (await vDB.users.findOne({ id: msg.author.id }).noCache())._doc;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:12:  let BGBASE = await DB.cosmetics.bgs();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:56:    DB.users.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:57:    DB.userInventory.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/craft.js:35:    const userDiscoveries = (await DB.userInventory.get(msg.author.id))?.inventory?.filter((itm) => itm.crafted).map((itm) => itm.id) || [];
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/favcolor.js:14:    const uData = await DB.users.get(usery.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:22:    DB.users.get({ id: msg.author.id }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:23:    DB.userInventory.getFull(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:29:    BASE = await DB.cosmetics.find({ type: "background", code: { $in: cosmeticsDoc?.bgInventory || [] } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:34:    BASE = await DB.cosmetics.find({ type: "medal", icon: { $in: cosmeticsDoc?.medalInventory || [] } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:39:    BASE = await DB.cosmetics.find({ type: "sticker", id: { $in: cosmeticsDoc?.stickerInventory || [] } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:73:  const COSMETICSDATA = await DB.userInventory.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:90:  const boxparams = await DB.items.findOne({ id: args?.boxID || "lootbox_C_O" });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/medalinfo.js:7:  const mdi = await DB.cosmetics.find({ type: "medal" });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:7:    DB.users.getFull({ id: msg.author.id }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:8:    DB.cosmetics.find({ type: "sticker" }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:9:    DB.items.find({ type: "boosterpack" }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:10:    DB.userInventory.getFull(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/any.js:4:    let BASE = await DB.cosmetics.find({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/index.js:20:  const userData = await DB.users.getFull({ id: message.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthBg.js:5:  const cosmeticsData = await DB.userInventory.get(userData.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthMedal.js:5:  const cosmeticsData = await DB.userInventory.get(userData.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/balance.js:25:    DB.userInventory.get(Target.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/balance.js:77:    lastTrans = await DB.audits.find({ $or: [{ from: TARGETDATA.id }, { to: TARGETDATA.id }] }).sort({ timestamp: -1 }).limit(5);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:54:    DB.users.getFull(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:247:        const BOOSTERS = await DB.items.find({ type: "boosterpack", rarity: { $in: ["C", "U", "R"] } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:292:    // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:297:    // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:303:      // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:312:      // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/givebox.js:19:  const [USERDATA] = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/givebox.js:48:      DB.users.getFull({ id: msg.author.id }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/givebox.js:49:      DB.users.getFull({ id: Target.id }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/givebox.js:50:      DB.items.find({ type: "box" }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/list.js:74:      (await DB.marketbase({ fullbase: 1 })).fullbase,
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/list.js:75:      DB.marketplace.find(query).countDocuments(),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/list.js:84:    const pagecontent = await DB.marketplace.find(query).limit(12).skip(12 * ((page || 1) - 1)).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/post.js:44:      DB.users.getFull({ id: msg.author.id }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/post.js:45:      DB.userInventory.getFull(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/post.js:120:    const validItem = await DB.items.findOne(itemFindQuery);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/post.js:121:    const checkCosmetic = await DB.cosmetics.findOne({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/transfer.js:18:    DB.users.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/transfer.js:19:    DB.users.get(TARGET.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:59:  const serverResps = DB.responses.findOne({ server: msg.guild.id }).noCache();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/airline/new.js:6:const STARTER_AIRPORTS_OPTIONS = DB.airlines.AIRPORT.find({ starter: true });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/airline/new.js:7:const STARTER_AIRPLANE_OPTIONS = DB.airlines.AIRPLANES.find({ starter: true });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/airline/new.js:40:  const existent = await DB.airlines.AIRLINES.findOne({ id: airlineID });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/airline/routes/new.js:38:    const port = await DB.airlines.AIRPORT.findOne({ IATA: airlineId });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/betflip.js:10:  const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:259:    DB.users.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:260:    DB.userInventory.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:272:  const DECKDATA = await DB.cosmetics.find({ type: "skin", for: "casino" });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:581:  const USERDATA = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/highscores/flags.js:4:    const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? "guessflag-server" : "", args[0] == "solo" || !args[0] ? "guessflag-solo" : ""] } }).sort({ points: -1 }).limit(10);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/highscores/_generic.js:4:  const RANKS = await DB.rankings
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/highscores.js:21:  const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? "guessflag-server" : "", args[0] == "solo" || !args[0] ? "guessflag-solo" : ""] } }).sort({ points: -1 }).limit(10);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/img/kiss.js:49:  const userData = Target ? await DB.users.findOne({ id: msg.author.id }).lean() : null;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/img/kiss.js:50:  const marriedtarget = await DB.relationships.find({ users: msg.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:5:    const userData_OLD = await vDB.users.findOne({ id: msg.author.id }).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:6:    const userData_NEW = await DB.users.findOne({ id: msg.author.id }).noCache();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:16:        // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:33:        // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:39:  const userData_OLD = await vDB.users.findOne({ id: msg.author.id }).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:40:  const userData_NEW = await DB.users.findOne({ id: msg.author.id }).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:166:          // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:168:          // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:275:          const myBGsFULL = await DB.cosmetics.find({ code: { $in: myBGs } }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:327:              // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:403:      let neodata = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:3:  const USERDATA = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:37:    const SVdata = await DB.servers.findOne({ id: primeServerId }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/status.js:71:		description: `Patch [\`v${ver}\`](https://ptb.discord.com/channels/277391723322408960/712055672799232092 "See patch notes • ${commit}") | Database \`${DB.version}\` | Engine \`Eris v${PLX.engine.VERSION}\``,
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/transactionlookup.js:7:  const log = await DB.audits.get({ transactionId: filterid });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/transactionlookup.js:25:    ? (await DB.users.get({ id: log.to }))?.meta
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/transactionlookup.js:26:    : (await DB.users.getFull({ id: log.from }))?.meta;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/transactionlookup.js:49:    const ouser = (await DB.users.findOne({ id: log.to }))?.meta || log.to;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/decks.js:8:      DB.cosmetics.find({ type: "skin", for: "casino" }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/decks.js:9:      DB.userInventory.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/inventory.js:49:    DB.users.get(Target.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/inventory.js:53:    DB.items.find().lean().exec(),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/inventory.js:54:    DB.userInventory.get(Target.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/use.js:5:    DB.users.getFull(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/use.js:6:    DB.userInventory.getFull(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/use.js:17:      const itemDetails = DB.items.get(ITEM);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:6:  const USERDATA = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:23:  const SVdata = (await DB.servers.findOne({ id: msg.args[0] }).lean()) || await vDB.servers.findOne({ id: msg.args[0] }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/claimtokens.js:5:    const oldUser = await vDB.users.findOne({ id: msg.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/errandfix.js:4:    const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/errandfix.js:5:    const errandsData = await DB.quests.find({ id: { $in: userData.quests?.map(e => e.id) } }).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/inventmigrate.js:3:  const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/inventmigrate.js:5:  // TODO(sunset): migrate to DB.userInventory
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:5:	const USERDATA = await vDB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:6:	const newUserData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:11:		const rships = await DB.relationships.find({users: msg.author.id});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:29:		newmar.preexistent = await DB.relationships.findOne({ users: { $all: [msg.author.id, mar.id] } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:161:			const newM = DB.relationships.create("marriage", thisMrg.users, thisMrg.initiative, thisMrg.ring, thisMrg.since);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/ban.js:14:  const serverData = await DB.servers.get(msg.guild.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/clear.js:6:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/kick.js:8:  const serverData = await DB.servers.get(msg.guild.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/lang.js:24:  const serverData = await DB.servers.get(msg.guild.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:17:  let ServerDATA = await DB.servers.get(Server.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:20:    await DB.servers.get(Server.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:214:    DB.mutes.add({ S: Mem.guild.id, U: Mem.id, E: freedom });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/paidroles.js:15:  const serverData = await DB.servers.get(msg.guild.id, { "modules.MODROLE": 1 });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/paidroles.js:20:  const roleMarket = await DB.paidroles.find({ server: msg.guild.id }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/purge.js:8:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:13:  const serverData = await DB.servers.get(msg.guild.id, { "modules.MODROLE": 1 });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:75:  const ReactionData = await DB.reactRoles.find({ server: msg.guild.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/adventure.js:123:  const LOCATIONS_B = await DB.advLocations.traceRoutes("LSGC", durationChoice);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/adventure.js:154:  //const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/adventure.js:158:  const playersHere = await DB.advJourneys.find({ location: selectedLocation._id, end: { $gt: Date.now() } }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/errands/forfeit.js:8:    const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/errands/forfeit.js:16:        let errandsData = await DB.quests.find({ id: { $in: notCompleted.map(e => e.id) } }).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/errands/index.js:43:    let errandsData = await DB.quests.find({ id: { $in: userErrands.map(e => e.id) } }).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:18:  let USERDATA = await DB.users.getFull({ id: message.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:51:  USERDATA = await DB.users.getFull({ id: message.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/roll.js:28:  const userDATA = await DB.users.get({ id: message.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/buyrole.js:4:  const roleMarket = await DB.paidroles.find({ server: msg.guild.id }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/buyrole.js:15:  const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/buyrole.js:27:    DB.temproles.add({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:14:    DB.users.findOne({ id: msg.author.id }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:15:    DB.userInventory.getFull(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:17:  const targetData = (await DB.commends.parseFull({ id: Target.id })) || {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:68:      DB.commends.add(userData.id, Target.id, 1),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:130:  const targetData = (await DB.commends.parseFull({ id: Target.id })) || {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:136:  const metas = await DB.users
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:4:  const marriages = await DB.relationships.find({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:31:          label: (await DB.users.getFull(uID)).tag,
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:91:  const user = await DB.users.getFull(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:92:  const partner = await DB.users.getFull(toDivorceUserId);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:164:  await DB.relationships.findByIdAndDelete(marriage._id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:232:  await DB.relationships.findByIdAndDelete(marriage._id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/give.js:2:  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/inventory.js:2:  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:4:  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:8:  const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:12:  const dbItemData = await DB.cosmetics.get({[giftMetadata.finder]:gift.item});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/peek.js:5:    const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/peek.js:8:    const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/wrap.js:26:  const userData = await DB.users.getFull({ id: msg.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:8:  return DB.users.find({}, PROJECTION).sort({ "progression.exp": -1 })
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:13:  const lRanks = await DB.localranks.find({ server }).sort({ exp: -1 })
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:15:  const dbRankData = await DB.users.find({ id: { $in: lRanks.map((u) => u.user) } }, PROJECTION).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:38:    // DB.servers.get(Server.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:40:    DB.users.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:41:    DB.localranks.get({ server: msg.guild.id, user: msg.author.id }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:46:      ? await DB.localranks.find({ server: msg.guild.id, exp: { $gt: selfLocal.exp } }, { _id: 1 }).count()
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:47:      : await DB.users.find({ "progression.exp": { $gt: userData.progression.exp } }, { _id: 1 }).count());
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:6:const userDB = DB.users;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:7:const serverDB = DB.servers;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:48:  const TARGET_DB = await userDB.findOne({ id: Target.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:49:  const SV_DB = await serverDB.findOne({ id: Server.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:51:  const favcolor = TARGET_DB.profile.favcolor || "#eb11da";
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:58:  const exp = TARGET_DB.progression.exp || 0;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:59:  const level = TARGET_DB.progression.level || 0;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:73:    l_exp = (await DB.localranks.get({ user: Target.id, server: msg.guild.id })).exp || 0;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:74:    l_level = (await DB.localranks.get({ user: Target.id, server: msg.guild.id })).level || 0;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:24:	const userMarriages = await DB.relationships.find({ type: "marriage", users: msg.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:39:		DB.users.getFull(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:40:		DB.userInventory.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:44:	const userInventoryFull = await DB.items.find( {series:"ring", id: { $in: inventoryIDmap}} ).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:155:		const marriages = await DB.relationships.find({ type: "marriage", users: msg.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:210:		const THIS_MARRIAGE_ID = (await DB.relationships.create("marriage", [msg.author.id, Target.id], msg.author.id, selectedRing.id))._id;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:331:	const userMarriages = await DB.relationships.find({users: user });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:348:							DB.items.findOne({ id: mrg.ring }).lean().exec()
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:410:		DB.users.getFull(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:411:		DB.userInventory.get(msg.author.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:415:	const userInventoryFull = await DB.items.find( {series:"ring", id: { $in: inventoryIDmap}} ).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:458:				selectedRing = await DB.items.findOne({id: val});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:462:				selectedRel = await DB.relationships.findOne({_id: val.toString()});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:480:	const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:507:				selectedRing = await DB.items.findOne({id: val});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:514:				selectedRel = await DB.relationships.findOne({_id: val});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:515:				selectedRing = await DB.items.findOne({id: selectedRel.ring});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:522:				const ringsCol = await DB.items.find({id:{$in: selectedRel.ringCollection }});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/personaltext.js:7:  const userData = await DB.users.findOne({ id: msg.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile-v1.js:138:    const dDATA = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile-v1.js:170:  let Target_Database = await DB.users.get({ id: Target.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profilelink.js:6:  const userdata = await DB.users.getFull({ id: TARGET.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/rank.js:11:    userData = await DB.users.get(TARGET.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/rank.js:12:    serverData = await DB.servers.get(msg.guild.id),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/rank.js:13:    selfLocal = await DB.localranks.get({ user: TARGET.id, server: msg.guild.id }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/rank.js:72:  LRpos = await DB.localranks.find({ server: msg.guild.id, exp: { $gt: selfLocal.exp } }, { _id: 1 }).countDocuments();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/roleme.js:2:	const GUILD = await DB.servers.findOne({ id: msg.guild.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/tagline.js:7:  const userData = await DB.users.findOne({ id: msg.author.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/thanks.js:17:    const TargetServerData = await DB.localranks.findOne({ user: Target.id, server: msg.guild.id }).noCache()
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/thanks.js:80:        const ServerDATA = await DB.servers.get(msg.guild.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:17:  const userData = await DB.users.get(m.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:20:  const myCommends = await DB.commends.parseFull(m.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:23:      DB.commends.aggregate([{ $group: { _id: "$from", total: { $sum: "$count" } } }, { $sort: { total: -1 } }, { $limit: 10 }]),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:24:      DB.commends.aggregate([{ $group: { _id: "$to", total: { $sum: "$count" } } }, { $sort: { total: -1 } }, { $limit: 10 }]),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:25:      ((await DB.commends.aggregate([{ $group: { _id: "$to", total: { $sum: "$count" } } }, { $match: { total: { $gt: myCommends.totalIn } } }, { $count: "COUNT" }]))[0]?.COUNT || 0) + 1,
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:26:      ((await DB.commends.aggregate([{ $group: { _id: "$from", total: { $sum: "$count" } } }, { $match: { total: { $gt: myCommends.totalOut } } }, { $count: "COUNT" }]))[0]?.COUNT || 0) + 1,
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:98:  const rank = await DB.localranks.find({ server: msg.guild.id, thx: { $gt: 0 } }).sort({ thx: -1 }).limit(10).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/chdeck.js:17:    const userChannelDeck = (await DB.users.get(msg.author.id)).switches?.channeldeck || [];
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/pin.js:6:  const serverData = await DB.servers.get(msg.guild.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/reminder.js:21:  const userReminders = await DB.feed.find({ url: msg.author.id }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:11:	const feedData = await DB.feed.find({ server: msg.guild.id, type: "rss" }).lean()
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:39:		await DB.feed["new"](payload);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/say.js:10:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/saytochannel.js:6:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:7:  const tagObj = await DB.responses.findOne({server:msg.guild.id,tag});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:63:  const serverResps = await DB.responses.findOne({ server:msg.guild.id, tag }).noCache();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:81:  const preexistingItem = await DB.responses.findOne({ server:msg.guild.id, tag }).noCache();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/twitchalert.js:32:    const feedData = await DB.feed.find({ server: msg.guild.id, type: "twitch" });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/weather.js:36:		args[0] = (await DB.users.get(msg.author.id, { personal: 1 })).personal?.city;
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:18:  const feedData = await DB.feed.find({ server: msg.guild.id, type: "youtube" });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/primerollout.js:10:    const thisSticker = await DB.cosmetics.findOne({ id: composeStickerName() }).noCache();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/eval.js:9:    .replace(DB.native.host, "[REDACTED]")
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/eval.js:10:    .replace(DB.native.name, "[REDACTED]")
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/eval.js:11:    .replace(DB.native.port, "[REDACTED]")
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/eval.js:12:    .replace(DB.native.pass, "[REDACTED]")
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/fanartApprove.js:6:    let Fanart = await DB.fanart.findOne({ hash });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/lvup.js:36:    const userData = await DB.users.get(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:125:        await DB.users.findOne({ "prime.servers": m.guild.id }).cache()
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:175:    const knownError = await DB.globals.findOne({code: errorCode, type: "errorCode", known: true });
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/Premium.js:8:      DB.users.get(user.id).then((usr) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:24:    const USERDATA = await DB.users.get({ id: user.id }, undefined, "users");
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:13: *  2. This is the ONLY file allowed to reference DB._legacyUserDB.
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:16: *     DB._legacyUserDB / DB.userDB exports from database_schema.
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:55: * @deprecated Use DB.users.get() directly when all users are migrated.
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:65:  const user = await DB.users.get(userId, projection);
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:71:    legacyUser = await DB._legacyUserDB.findOne({ id: userId }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:96: * @deprecated Use DB.users.getFull() directly when all users are migrated.
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:104:  const user = await DB.users.getFull(userId);
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:114:    legacyUser = await DB._legacyUserDB.findOne({ id: userId }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:132:  return DB.users.getFull(userId);
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:138: * @deprecated Use DB.userInventory.get() directly when all users are migrated.
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:146:  const cosmetics = await DB.userInventory.get(userId);
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:152:    legacyUser = await DB._legacyUserDB.findOne(
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:190: * @deprecated Use DB.userInventory.getFull() directly when all users are migrated.
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:198:  let doc = await DB.userInventory.getFull(userId);
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:214:  return DB.userInventory.getFull(userId);
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:220: * @deprecated Use DB.userOAuth.get() directly when all users are migrated.
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:228:  const oauth = await DB.userOAuth.get(userId);
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:233:    legacyUser = await DB._legacyUserDB.findOne(
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:79:  const inFlight = DB.servers.findOne({ id: guildId }).lean().exec()
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:335:      await DB.users.getFull({ id: luckyOne.id }).then((userdata) => userdata.addItem(BOX.id));
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/customResponses.js:15:	const gResps = await DB.responses.find({ server: msg.guild.id }).noCache() || [];
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/index.js:18:  DB.feed.find({ server: {$in: allGuilds } }).lean().then(async (/** @type {Feed[]} */serverFeeds) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/index.js:20:    const servers = await DB.servers.find({ id: { $in: serverFeeds.map((f) => f.server) } }, { "modules.LANGUAGE": 1, id: 1 }).lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/globalLevelUp.js:41:	userData ??= await DB.users.getFull(msg.author.id);
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:3:const getLocalRank = (GID,UID) => DB.localranks.findOne({ user: UID, server: GID }).noCache();
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:29:	DB.localranks.incrementExp({ U: userID, S: serverID });
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/microtasks/serverCache.js:13:    return DB.servers.find(query).lean().exec().then((servers) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/microtasks/serverCache.js:44:    return DB.channels.find(query).lean().exec().then((channels) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryMessage.js:26:    msg.guild.serverData = await DB.servers.findOne({ id: msg.guild.id }).cache();
 - z:/POLLUX/POLARIS/DEV/bot/core/utilities/Gearbox/client.js:14:        if (enforceDB && !(await DB.users.get(ID))) return Promise.reject("USER NOT IN DB");
 - z:/POLLUX/POLARIS/DEV/bot/core/utilities/Gearbox/client.js:37:        if (enforceDB && !(await DB.users.get(ID))) return Promise.reject( new Error("USER NOT IN DB") );
 - z:/POLLUX/POLARIS/DEV/bot/core/utilities/Premium.js:21:      DB.users.get(user.id).then((usr) => {
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:5:> **Note:** at the time of writing the bot accesses the database indirectly via the `DB`/`vDB` connection objects returned by `@polestarlabs/database_schema`.  Most read/write operations live in helper modules, subroutines, or command files (see `core/`) and are performed through shared packages under `node_modules`.  The only **direct** `DB.` call inside this repository is the blacklist fallback in `pollux.js`; every other interaction occurs in the modules listed below.  For migration, each of these must be replaced by the appropriate dashboard API endpoint.
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:24:| `core/commands/infra/*` | users, vDB.users, servers, audits, etc. | both | R/W | ❓ (migration utilities likely no) | ✅ yes |
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:40:core/archetypes/Premium.js: ... DB.users.set ...
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:43:core/archetypes/Switch.js: ... DB.servers.get ... DB.channels.get/new ... DB.servers.set ... DB.channels.set ...
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:44:core/archetypes/UserProfileModel.js: ... DB.users ... DB.localranks.get ... DB.relationships.findOne ...
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:45:core/archetypes/Venture.js: ... DB.advLocations.findOne/traceRoutes/find ... DB.advJourneys.countDocuments ...
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:46:core/commands/beta/debug.js: DB.users.set/findOne ...
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:47:core/commands/beta/vdiff.js: DB.users.findOne/noCache ... DB.userInventory.get ...
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:51:core/commands/img/kiss.js: DB.users.findOne ... DB.relationships.find ... DB.relationships.set ...
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:55:-sidecar.js cron jobs: DB.temproles, DB.mutes, DB.feed
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:68:4. **Bot modifications:** each `DB.*` call in the bot code will be replaced by an HTTP client request (e.g. `PLX.api.get(…)` or `PLX.api.post(…)`) matching the new endpoint names. A wrapper library may abstract the translation.
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildCreate.js:4:    await DB.servers.get(guild.id).then(async sv=>{
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildMemberAdd.js:2:  Promise.all([DB.servers.findOne({id:guild.id}).cache(), DB.users.findOne({id:member.id}).cache()]).then(([svData, userData]) => {
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildMemberRemove.js:2:  Promise.all([DB.servers.findOne({id:guild.id}).cache(), DB.users.findOne({id:member.id}).cache()]).then(([svData, userData]) => {
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/interactions/langsel.js:11:    const serverData = await DB.servers.get(interaction.guild.id, { "modules.MODROLE": 1 });
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/messageReactionAdd.js:5:  DB.reactRoles.findOne({ channel: msg.channel.id, message: msg.id }).then((RCT) => {
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/messageReactionRemove.js:4:  DB.reactRoles.findOne({ message: msg.id, channel: msg.channel.id }).then((RCT) => {
 - z:/POLLUX/POLARIS/DEV/bot/ISSUES_AUDIT.md:59:- [ ] TODO: add emojis and save adventure to DB. See [core/commands/pollux/adventure.js](core/commands/pollux/adventure.js).
 - z:/POLLUX/POLARIS/DEV/bot/pollux.js:192:      DB.users
 - z:/POLLUX/POLARIS/DEV/bot/pollux.js:196:      DB.servers
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:89:        DB.servers.get(tprl.server).then(async (/* svData */) => {
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:135:        DB.servers.get(muteSv).then((svData) => {
 - z:/POLLUX/POLARIS/DEV/bot/startup/auxiliarySideFunctions.js:7:        let udata = await DB.users.findOne({ id: user.id });
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:112:      DB.users.get.mockResolvedValueOnce(userData);
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:120:      DB.users.get.mockResolvedValueOnce(userData);
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:137:      DB.users.get.mockResolvedValueOnce(null);
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:152:      DB.users.get.mockResolvedValueOnce(userData);
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:165:      DB.users.get.mockResolvedValue(richUser);
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:182:      DB.users.get.mockResolvedValueOnce(brokeUser);
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:216:      DB.users.get.mockResolvedValue(user);
 - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:17:    global.DB.servers.findOne = jest.fn(() => ({
 - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:63:    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(1);
 - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:69:    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(2);
 - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:114:    global.DB.servers.findOne = jest.fn(() => ({
 - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:127:    global.DB.users = { set: jest.fn().mockResolvedValue(true), getFull: jest.fn().mockResolvedValue({ addItem: jest.fn() }) };
\n## Detailed write operations\n
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:18:    //  return DB.progression.set({achievement,user,type:'achievement'},{$set: {awarded:true} } );
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:30:      return DB.progression.set({achievement,user,type:'achievement'},{$inc: {tracker:value} } );
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:33:      //return DB.progression.set({achievement,user,type:'achievement'},{$set: {tracker:value} } );
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:141:    DB.users.set(uID, { $inc: { "progression.exp": awarded.exp || 100 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:16:        return DB.airlines.SLOTS.new((await (this.airline)).id, airportData.id, time);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:35:    return DB.airlines.AIRLINES.new(ownerID, airlineID, airlineName);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:39:    return DB.airlines.ROUTES.new(departure, destination, this.id, airplane, ticketPrice);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:290:      DB.userInventory.bulkWrite(cosmeticsToWrite),
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:291:      DB.users.bulkWrite(toWrite),
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:299:      return DB.audits.collection.insertMany(payloads)
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:390:  await DB.users.bulkWrite(toWrite);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:391:  await DB.audits.collection.insertMany(payloads);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:415:  await DB.audits.new({ ...fields, ...payload });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:477:    await DB.users.set(userID, { $set: { "counters.prime_streak": {} } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:483:  if (!tierStreaks || !currentTierStreak)  await DB.users.set(userID, { $set: { [`counters.prime_streak.${currentTier}`]: 1 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:484:  else await DB.users.set(userID, { $inc: { [`counters.prime_streak.${currentTier}`]: 1 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:486:  if (!totalStreak) await DB.users.set(userID, { $set: { "counters.prime_streak.total": 1 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:487:  else await DB.users.set(userID, { $inc: { "counters.prime_streak.total": 1 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:648:    //await DB.users.set(userID, { "modules.EVT": 0 }).catch((err) => { console.error(err); return null; });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:654:    ? await DB.userInventory.bulkWrite(bulkWriteQuery).catch((err) => { console.error(err); return null; })
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:656:  const q2 = await DB.users.set(userID, regularQuery).catch((err) => { console.error(err); return null; });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:658:    ? await DB.userInventory.set(userID, cosmeticsQuery).catch((err) => { console.error(err); return null; })
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:102:                await DB.users.set(userID, {
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:136:        await DB.users.updateOne({ id: userID, "quests._id": questUniqueID }, { $inc: { 'quests.$.progress': value } }, { new: !0 });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:141:        await DB.users.updateOne({ id: userID, "quests._id": questUniqueID }, { $set: { 'quests.$.progress': value } }, { new: !0 });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:146:        await DB.users.set(userID, { $set: { quests } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:168:                    await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:172:                    await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:191:            await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:195:            await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:210:        await DB.users.set(userID, { $push: { quests: newQuest } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:217:        await DB.users.set(userID, { $pull: { "quests": { id: questID } } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:222:        await DB.users.set(userID, { $push: { quests: newQuest } });
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:309:    await DB.users.set(userID, {
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:16:    return DB.promocodes.updateOne({ code: this.code}, {locked: true});
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:19:    return DB.promocodes.updateOne({ code: this.code}, {locked: false});
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:45:    let res = await DB.promocodes.updateOne({ code: this.code }, query);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:162:        await DB.promocodes.updateOne({ code }, {
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:186:      await DB.users.set(this.user, {$addToSet: {[`modules.${sPrize.inventory}`]: prizeItem.code||prizeItem.icon||prizeItem.id } } );
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:196:    return DB.audits.new({
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:146:      if (!guildobj) guildobj = DB.guilds.new(this._guild); // FIXME Both of these return void?
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:147:      if (!channelobj) channelobj = DB.channels.new(this._channel);
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:177:      DB.servers.set(this._guild.id, { $set: { "modules.DISABLED": this.gd } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:178:      DB.channels.set(this._channel.id, { $set: { "modules.DISABLED": this.cd, "modules.ENABLED": this.ce } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Tarot.js:113:      DB.users.set(user.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:16:    DB.users.set(msg.author.id, { $inc: { "currency.RBN": AMT } }).then(() => {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:22:    DB.users.set(msg.author.id, { $inc: { "currency.SPH": AMT } }).then(() => {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:28:    DB.users.set(msg.author.id, { $inc: { "currency.JDE": AMT } }).then(() => {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:79:        return DB.users.set({ id: msg.author.id }, { $set: { "profile.bgID": selectedBG.code } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:86:        DB.users.set({ id: msg.author.id }, { $set: { "profile.bgID": selectedBG.code } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:87:        DB.userInventory.set(msg.author.id, { $addToSet: { bgInventory: selectedBG.code } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/favcolor.js:42:  DB.users.set(msg.author.id, { $set: { "profile.favcolor": (`#${res.hex}`).replace("##", "#") } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:100:        if (targetItem.type === "background") DB.userInventory.set(msg.author.id, { $pull: { bgInventory: targetItem.code } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:101:        if (targetItem.type === "sticker") DB.userInventory.set(msg.author.id, { $pull: { stickerInventory: targetItem.id } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:102:        if (targetItem.type === "medal") DB.userInventory.set(msg.author.id, { $pull: { medalInventory: targetItem.icon } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:72:  const USERDATA = (await DB.users.getFull({ id: msg.author.id })) || (await DB.users.new(msg.author));
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:76:    await DB.users.set(msg.author.id, { $inc: { "counters.cross_server_box_attempts": 1 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:138:        DB.users.set(USERDATA.id, lootbox.bonus.query),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:292:  if (loot.type === "background") return DB.userInventory.set(USERDATA.id, { $addToSet: { bgInventory: (loot.code || loot.id) } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:294:  if (loot.type === "medal") return DB.userInventory.set(USERDATA.id, { $addToSet: { medalInventory: (loot.icon || loot.id) } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:45:    DB.userInventory.set(msg.author.id, { $addToSet: { stickerInventory: { $each: [stk1.id, stk2.id] } } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthBg.js:17:      DB.users.set({ id: userData.id }, { $set: { "profile.bgID": selectedItem.code } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthBg.js:18:      DB.userInventory.set(userData.id, { $addToSet: { bgInventory: selectedItem.code } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthMedal.js:16:    return DB.userInventory.set(userData.id, { $addToSet: { medalInventory: selectedItem.icon } }).then(() => { });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/balance.js:24:    DB.users.get({ id: Target.id }).then(d => d || DB.users.new(msg.author)),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/local$.js:117:    await DB.audits.new(msg.author, amt, "local$_convert", eco.code); // NOTE audit is automatically made -- double auditing?
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/local$.js:135:    await DB.audits.new(msg.author, -amt, "local$_convert", eco.code);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/delete.js:10:    DB.marketplace.get({ $or: [{ id: args[0] }, { item_id: args[0] }], author: msg.author.id }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/delete.js:11:    (await DB.marketbase({ fullbase: 1 })).fullbase,
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/delete.js:18:    DB.marketplace.remove({ id: offer.id }).then((res) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:84:    await DB.responses.set(responseObject, { upsert: true });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:98:    await DB.responses.set(responseObject, { upsert: true });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:120:    await DB.responses.set(responseObject, { upsert: true });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:136:      DB.responses.new({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:266:    await DB.users.set(msg.author.id, { "profile.skins.blackjack": "default" });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:284:    await DB.users.set(msg.author.id, { "profile.skins.blackjack": targetDeck.localizer });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/guessflag.js:48:      await DB.rankings.collection.insert(data);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/hangmaid/index.js:177:      await DB.rankings.collection.insert(payload);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/img/kiss.js:60:    await DB.relationships.set({ _id: marriedtarget._id }, { $inc: { lovepoints: pris } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:34:        await DB.users.set(msg.author.id, { $set: { "switches.migrateFix.inv":true, "modules.inventory": Object.assign(newInventory,oldInventory) } }).catch(console.error);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:66:        await DB.users.set(msg.author.id, { $inc: { "currency.SPH": -1 * (cost+(5*marryFixes||0)) || 0 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:138:          await DB.users.set(msg.author.id, { $inc: { "currency.SPH": -1 * cost || 0 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:167:          await DB.users.set(msg.author.id, { $set: { "modules.inventory": newInventory } }).catch(console.error);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:181:          const updatedUserDB = DB.users.findOne({id:msg.author.id}).noCache().lean();
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:182:          let boxes = updatedUserDB.modules.inventory.filter(item=>item.id.includes('lootbox'));
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:184:          let bulk = await DB.users.bulkWrite(boxes.map(q=> ({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:194:          await DB.users.set(msg.author.id, { $set: { "currency.PSM": exceedingBoxBonus } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:209:          await DB.users.set(msg.author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:256:          let result = await DB.users.set(msg.author.id, { $addToSet: { 'modules.skinInventory': 'casino_touhou-classic' } }).catch(err => null);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:278:          //await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:286:          await vDB.users.set(msg.author.id, { $set: { "switches.rankFrozen": true } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:287:          await DB.users.set(msg.author.id, { $set: { "counters.legacy.globalLV": userData_OLD.modules.level, "counters.legacy.globalXP": userData_OLD.modules.exp } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:301:            await DB.users.set(msg.author.id, { $set: { "prime.tier": oldDonoTier, "counters.prime_streak": oldDonoStreak } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:308:          // await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:318:          await DB.users.set(msg.author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:337:          // await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:377:      await vDB.users.set(msg.author.id, { $set: { "migrated": true } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:378:      await DB.users.set(msg.author.id, { $set: { "migrated": true } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:402:      await vDB.users.set(msg.author.id, { $set: { "switches.tokensMigrated": true } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:45:      await DB.users.set(msg.author.id, {$pull: { "prime.servers": SVdata.id }});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:74:    await DB.users.set(msg.author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:77:    await DB.users.set(msg.author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:46:  //await DB.servers.set(SVdata.id,{$set:{'premium' : true}});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:47:  //await DB.users.set(msg.author.id,{$inc:{'prime.servers' : 1}});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:48:  await DB.users.set(msg.author.id, { $set: { 'prime.maxServers': MAXPREM } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:49:  await DB.users.set(msg.author.id, { $push: { 'prime.servers': msg.args[0] } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/claimtokens.js:9:    await DB.users.set(msg.author.id, { $set: { "currency.EVT": oldUser.eventGoodie  || 0} });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/claimtokens.js:10:    await vDB.users.set(msg.author.id, { $set: { "switches.tokensMigrated2": true } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:180:		await DB.users.set(msg.author.id, { $inc: { "switches.migrateFix.marry":1} }).catch(console.error);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/lang.js:10:          await DB.channels.set(interaction.message.channel.id, { "modules.LANGUAGE": langTo.iso });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/lang.js:14:      await DB.servers.set(interaction.guild.id, { "modules.LANGUAGE": langTo.iso });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:19:    await DB.servers.new(msg.guild);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:119:        DB.servers.set(Server.id, { $set: { "modules.MUTEROLE": role.id } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/paidroles.js:29:    await DB.paidroles.new({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/paidroles.js:52:    await DB.paidroles.remove({ role: target.role });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:40:              DB.reactRoles.set({ message: message.id, channel, server: msg.guild.id }, { $addToSet: { rolemoji: { role: role.id, emoji: argmoji } } }).then((db) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:84:        DB.reactRoles.set({ server: msg.guild.id, message: arg1 }, { $pull: { rolemoji: reactionItem } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:89:        await DB.reactRoles.remove({ server: msg.guild.id, message: arg1 });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:103:    await DB.reactRoles.remove({ server: msg.guild.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/adventure.js:166:  DB.advJourneys.new(msg.author.id, Adventure, Adventure.journey);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/rewards.js:191:        await DB.users.set(msg.author.id,{$addToSet:{'modules.stickerInventory': "australis21stk" }});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:28:      await DB.users.set({ id: message.author.id, "switches.variables.tag": tag }, { $set: { "switches.variables.$.value": value } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:30:      await DB.users.set(message.author.id, { $push: { "switches.variables": { tag, value } } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:37:      await DB.users.set({ id: message.author.id, "switches.variables.tag": tag }, { $set: { "switches.variables.$.tag": value } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:39:      await DB.users.set(message.author.id, { $push: { "switches.variables": { tag, value } } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:45:      await DB.users.set({ id: message.author.id }, { $set: { "switches.variables": [] } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:47:      await DB.users.set({ id: message.author.id }, { $pull: { "switches.variables": { tag } } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/editprofile.js:33:  const userData = (await DB.users.get(msg.author.id)) || (await DB.users.new(msg.author));
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/give.js:22:  await DB.gifts.updateOne({ _id: gift._id }, update);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:51:        await DB.gifts.remove({ _id: gift._id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:55:        await DB.users.set(msg.author.id, { $addToSet: { [`modules.${ giftMetadata.inventory}`]: gift.item } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/wrap.js:182:      await DB.users.set(msg.author.id, destroystring);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/wrap.js:183:      await DB.gifts.set(Date.now(), giftItem);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:260:		DB.users.set(Target.id, { featuredMarriage: THIS_MARRIAGE_ID });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:267:		DB.users.set(msg.author.id, { featuredMarriage: THIS_MARRIAGE_ID });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:510:				DB.relationships.set( {_id: selectedRel._id} , {$set: {ring: val }});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:518:				DB.users.set(msg.author.id, {$set: {featuredMarriage: val }});				
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:569:			await DB.relationships.set({ _id: THIS_MARRIAGE_ID }, { $addToSet: {ringCollection: RING.id }, $set: { ring: RING.id } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/personaltext.js:10:  await DB.users.set(msg.author.id, { $set: { "profile.persotext": persotxt } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile-v1.js:142:      DB.users.set(msg.author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile-v1.js:150:      DB.users.set(msg.author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile.js:154:    const dDATA = (await DB.users.get(msg.author.id)) || DB.users.new(msg.author);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile.js:158:      DB.users.set(msg.author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile.js:167:      DB.users.set(msg.author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile.js:191:  let Target_Database = (await DB.users.findOne({ id: Target.id }).noCache().populate("marriageData")) || (await DB.users.new(Target));
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/tagline.js:10:  await DB.users.set(msg.author.id, { $set: { "profile.tagline": persotxt } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/thanks.js:16:    await DB.localranks.set({ user: Target.id, server: msg.guild.id }, { $inc: { thx: 1 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/thanks.js:97:            await DB.localranks.set({ user: Target.id, server: msg.guild.id }, { thx: 0 }).catch((err) => {
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/chdeck.js:5:      await DB.users.set(msg.author.id, { $addToSet: { "switches.channeldeck": { $each: targetChannels } } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/chdeck.js:11:      await DB.users.set(msg.author.id, { $pull: { "switches.channeldeck": { $each: [targetChannels] } } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/reminder.js:48:    await DB.feed.deleteOne({ _id: targetReminder._id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/reminder.js:94:  await DB.feed.new({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:31:			await DB.feed.set({ server: msg.guild.id, url: str }, { $set: { channel } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:65:			// await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:66:			await DB.feed.deleteOne({ server: msg.guild.id, url: toDelete.url });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:85:		await DB.servers.set({ id: msg.guild.id }, { $set: { "modules.defaultRSSChannel": channel } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/say.js:59:  await DB.control.collection.insert({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:66:  await DB.responses.deleteOne({ server:msg.guild.id, tag });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:115:    await DB.responses.set(responseObject, { upsert: true });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:129:    await DB.responses.set(responseObject, { upsert: true });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:153:    await DB.responses.set(responseObject, { upsert: true });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:169:      DB.responses.new({
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/twitchalert.js:69:                await DB.feed.deleteOne({ server: msg.guild.id, _id: todelete._id });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:43:      await DB.feed.set({ server: msg.guild.id, url: channelID }, { $set: { channel } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:51:    await DB.feed.new(payload);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:80:      // await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:81:      await DB.feed.deleteOne({ server: msg.guild.id, url: toDelete.url });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:100:    await DB.feed.set({ server: msg.guild.id }, { $set: { defaultChannel: channel } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/istranslator.js:4:  await DB.users.set(Target.id, { $set: { "switches.role": "translator", "switches.translator": args[0].toUpperCase() } });
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/primerollout.js:43:        let res = await DB.cosmetics.updateOne({ id: composeStickerName() }, { $set: { name: newName || thisSticker.name, public: true } }).catch(err => null);
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/primerollout.js:56:            DB.users.updateMany({ "prime.active": true }, { "prime.active": false }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/primerollout.js:57:            DB.users.updateMany({ "donator": { $exists: true } }, { "donator": null }),
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/fanartApprove.js:13:        return DB.fanart.updateOne({ hash }, { $set: { publish: false, 'extras.rank': 99 } })
 - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/fanartApprove.js:17:    await DB.fanart.updateOne({ hash }, { $set: { publish: true, 'extras.rank': 1 } })
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:134:      DB.users.new(m.author).catch((err) => null);
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:176:    if (!knownError) await DB.globals.updateOne({code: errorCode},{ $set:{ known: false , type: "errorCode"},$inc:{ocurrences: 1} });
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:177:    else await DB.globals.updateOne({code: errorCode}, { $inc:{ocurrences: 1} });
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:52:        await DB.users.set(user.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:65:      await DB.users.set(user.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:72:    await DB.users.set(user.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:157:    DB.users.set(Author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:165:      await DB.users.set(Author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:169:      await DB.users.set(Author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:123:    await DB.users.updateOne(
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:206:    await DB.userInventory.updateOne(
 - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:365:    await DB._legacyUserDB.updateOne(
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:129:      return DB.users.set(trigger.author.id, { $inc: { "progression.exp": -10 } });
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:341:        DB.users.set({ id: { $in: ids } }, { $inc: { "progression.exp": 100 } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:342:        DB.users.set(luckyOne.id, { $inc: { "progression.exp": 500 } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:343:        DB.control.set(
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:351:        DB.control.set({ id: { $in: ids } }, { $inc: { "data.boxesLost": 1 } }),
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:44:		await DB.feed.updateOne(
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:69:					await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:72:					await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:92:				await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:94:				await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/twitch.js:65:    await DB.feed.updateOne(
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/youtube.js:39:    await DB.feed.updateOne(
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/globalLevelUp.js:35:const commitLevel = (U,L) => DB.users.set(U, { $set: { "progression.level": L } });
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:22:	if (!LOCAL_RANK) return DB.localranks.new({ U: userID, S: serverID, level: 0, exp: 0 });
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:37:		await DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:52:		DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/microtasks/serverCache.js:20:        if (!sv.cluster) DB.servers.set({ id: sv.id }, { cluster: PLX.cluster.id });
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:5:    DB.users.updateMeta(msg.author);
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:6:    if (msg.guild) DB.serverDB.updateMeta(msg.guild);
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:22:    return DB.users.updateOne({ id: usID }, { $inc: { "progression.exp": EXP } }, { upsert: false }).lean().exec();
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:29:      DB.globalDB.set({
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:35:      DB.control.set(message.author.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:45:          return DB.control.set(message.guild.id, {
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/updateGuildSettings.js:10:        || await JSON.parse( (await PLX.redis.aget(`${DB.raw.db.databaseName}.serverdb.findOne.{"id":"${thisServer.id}"}`))||"null" )
 - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/updateGuildSettings.js:11:        || await DB.servers.findOne({id:thisServer.id}).cache();
 - z:/POLLUX/POLARIS/DEV/bot/core/utilities/_Gearbox.bak:46:    DB.users.new(user.user||user);
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:41:core/archetypes/Progression.js: ... DB.users.findOne ... DB.users.updateOne ... DB.quests.find ...
 - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:42:core/archetypes/Redeem.js: ... DB.promocodes.findOne/updateOne ... DB.users.getFull ... DB.cosmetics.get ... DB.audits.new ...
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildCreate.js:5:        if (!sv) await DB.servers.new(guild);
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildCreate.js:6:        await DB.servers.set(guild.id,{$addToSet: {activeClients:PLX.user.id} });
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildDelete.js:4:    DB.servers.set(guild.id,{$pull: {activeClients:PLX.user.id} });
 - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/interactions/booruSave.js:10:    let res = await DB.usercols.updateOne({ id: interaction.userID }, { $addToSet: { "collections.boorusave": save } }, { upsert: true });
 - z:/POLLUX/POLARIS/DEV/bot/resources/items/streakfix+.js:21:      await DB.users.set(userData.id, { [`counters.${TARGET}.streak`]: destinationCounter.highest });
 - z:/POLLUX/POLARIS/DEV/bot/resources/items/streakfix+.js:22:      await (await DB.userInventory.getFull(userData.id)).removeItem("streakfix+", 1);
 - z:/POLLUX/POLARIS/DEV/bot/resources/items/streakfix.js:21:      await ( await DB.userInventory.getFull(userData.id) ).removeItem("streakfix", 1);
 - z:/POLLUX/POLARIS/DEV/bot/resources/items/streakfix.js:22:      await DB.users.set(userData.id, { [`counters.${TARGET}.streak`]: destinationCounter.lastStreak });
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:86:  DB.temproles.find({ expires: { $lte: Date.now() + 75e3 } }).lean().exec()
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:99:                await DB.temproles.remove({ _id: tprl._id });
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:103:              await DB.temproles.expire({ U: tprl.user, S: tprl.server });
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:132:  DB.mutes.find({ expires: { $lte: Date.now() + 75e3 } })
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:142:                // DB.mutes.expire(Date.now());
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:199:  DB.feed.find({ expires: { $lte: Date.now() + 45e3 } }).limit(50).lean()
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:212:              await DB.feed.deleteOne({ _id: rem._id });
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:224:              await DB.feed.updateOne({ _id: rem._id }, { $inc: { failed: 1 } });
 - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:226:              await DB.feed.deleteOne({ _id: rem._id });
 - z:/POLLUX/POLARIS/DEV/bot/startup/auxiliarySideFunctions.js:8:        if (!udata) udata = await DB.users.new(user);
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:166:      DB.users.bulkWrite.mockResolvedValue({});
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:167:      DB.audits.collection.insertMany.mockResolvedValue({});
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:173:      expect(DB.users.bulkWrite).toHaveBeenCalledTimes(1);
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:174:      expect(DB.audits.collection.insertMany).toHaveBeenCalledTimes(1);
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:217:      DB.users.bulkWrite.mockResolvedValue({});
 - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:218:      DB.audits.collection.insertMany.mockResolvedValue({});
\n---\n\n## Automation\nYou can keep this audit current by running the helper script included in this repo.\n\nbot/\n\nThe script reruns the grep over the codebase and appends any new read/write lines under the respective sections. Run it whenever you add or modify  calls, and the file will naturally grow with every query.\n
---

## Automation
You can keep this audit current by running the helper script included in this repo.

```bash
# from the bot/ directory
./scripts/update_db_interactions.sh
```

The script reruns the grep over the codebase and appends any new read/write lines under the respective sections. Run it whenever you add or modify `DB.` calls, and the file will naturally grow with every query.

\n## Detailed read operations (updated Sat, Mar  7, 2026  3:14:09 PM)\n
 - ./core/archetypes/Achievements.js:4:let ACHIEVEMENTS = DB.achievements.find({}).noCache().lean().then(a => ACHIEVEMENTS = a);
 - ./core/archetypes/Achievements.js:15:    await DB.achievements.award(user, achievement);
 - ./core/archetypes/Achievements.js:24:    //  return !!(await DB.progression.get({achievement,user,type:'achievement'})).awarded;
 - ./core/archetypes/Achievements.js:59:      if ((!userData?.modules && userData.id) || typeof userData === "string") userData = await DB.users.findOne({ id: userData.id || userData }).noCache().lean();
 - ./core/archetypes/Achievements.js:62:      const statistics = (await DB.control.findOne({ id: userData.id }).noCache())?.data?.statistics;
 - ./core/archetypes/Achievements.js:137:    const userData = await DB.users.get(uID);
 - ./core/archetypes/Airline.js:6:    this.airline = DB.airlines.AIRLINES.findOne({ id });
 - ./core/archetypes/Airline.js:11:    const airportData = await DB.airlines.AIRPORT.findOne({ id: airport });
 - ./core/archetypes/Airline.js:14:    await DB.airlines.SLOTS.validate((await (this.airline)).id, airportData.id).then(ok=>{
 - ./core/archetypes/Airline.js:26:    const airplaneData = await DB.airlines.AIRPLANES.findOne({ id });
 - ./core/archetypes/Airline.js:30:      return DB.airlines.AIRPLANES.buy((await this.airline).id, airplaneData.id);
 - ./core/archetypes/Airline.js:43:    return DB.airlines.ROUTES.shutdown(route);
 - ./core/archetypes/Crafter.js:12:  return DB.items.find({}).lean().then((ALLITEMS) => {
 - ./core/archetypes/Crafter.js:94:      DB.users.getFull({ id: userid }),
 - ./core/archetypes/Crafter.js:95:      DB.users.get(userid),
 - ./core/archetypes/Crafter.js:96:      DB.userInventory.get(userid),
 - ./core/archetypes/Crafter.js:477:    let initialItems = await DB.items.find({
 - ./core/archetypes/Economy.js:205:  return DB.users.get(uID).then((  /** @type { { currency: {[K in Currency]:number} } | null } */ userData) => {
 - ./core/archetypes/Economy.js:400: * NOTE: this will immediately end up in DB.
 - ./core/archetypes/Inventory.js:10:      DB.items.find({ type: this.invType }).lean().exec().then((boxes) => resolve(boxes));
 - ./core/archetypes/Inventory.js:14:  getUserData() { return DB.users.get(this.userID); }
 - ./core/archetypes/Premium.js:312:const PREMIUM_STICKERS = DB.cosmetics.find({ public: true, GROUP: "plx_collection" }).noCache()
 - ./core/archetypes/Premium.js:314:const PREMIUM_PACKS = DB.items.find({ type: "boosterpack", filter: "plx_collection" }).noCache()
 - ./core/archetypes/Premium.js:391:  const userData = (await DB.users.findOne({ id: mansionMember.id }).noCache())?._doc;
 - ./core/archetypes/Premium.js:458:  const userData = await DB.users.findOne({ id: userID }).noCache();
 - ./core/archetypes/Premium.js:459:  const cosmeticsData = await DB.userInventory.get(userID);
 - ./core/archetypes/Premium.js:514:  // cosmetics ops (inventory, flairs, medals) go to DB.userInventory separately
 - ./core/archetypes/Premium.js:711:  const usr = await DB.users.get(userID);
 - ./core/archetypes/Progression.js:125:        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; //this.userQuestsCache.get(userID);
 - ./core/archetypes/Progression.js:127:            const userData = await DB.users.findOne({ id: userID }).noCache().lean() || [];
 - ./core/archetypes/Progression.js:202:        let quest = await DB.quests.get(questID);
 - ./core/archetypes/Progression.js:211:        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; // this.userQuestsCache.get(userID) || [];
 - ./core/archetypes/Progression.js:218:        const userData = await DB.users.findOne({ id: userID }).noCache().lean();
 - ./core/archetypes/Progression.js:223:        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; //this.userQuestsCache.get(userID) || [];
 - ./core/archetypes/Progression.js:230:        const userData = await DB.users.findOne({ id: userID }).noCache().lean();
 - ./core/archetypes/Progression.js:232:        return (await DB.quests.find({ public: true, reveal_level: { $lte: userData.progression.level } }).lean());
 - ./core/archetypes/Progression.js:300:    const quest = await DB.quests.get(userQuest.id);
 - ./core/archetypes/Progression.js:301:    const currentUserQuests = (await DB.users.findOne({ id: userID }, { quest: 1 }).noCache())?.quests || [];
 - ./core/archetypes/Redeem.js:11:    this.data = await DB.promocodes.findOne({ code: this.code }).lean();
 - ./core/archetypes/Redeem.js:160:      let redata = await DB.promocodes.findOne({ code }).lean();
 - ./core/archetypes/Redeem.js:169:    const userData = await DB.users.getFull(this.user);
 - ./core/archetypes/Redeem.js:180:      const prizeItem = DB.cosmetics.get( Object.assign({
 - ./core/archetypes/Switch.js:143:      DB.servers.get(this._guild.id),
 - ./core/archetypes/Switch.js:144:      DB.channels.get(this._channel.id),
 - ./core/archetypes/UserProfileModel.js:53:    return DB.users
 - ./core/archetypes/UserProfileModel.js:63:      DB.commends.parseFull(this.ID)
 - ./core/archetypes/UserProfileModel.js:79:      return DB.localranks.get({ user: this.ID, server: this.server }).then(async (svRankData) => {
 - ./core/archetypes/UserProfileModel.js:81:        this.localRank = await DB.localranks
 - ./core/archetypes/UserProfileModel.js:91:      let marriage = this.marriage || await DB.relationships.findOne({ type: "marriage", _id: this.featMarriage });
 - ./core/archetypes/Venture.js:227:    const LOC = await DB.advLocations.findOne({ id: location }).lean();
 - ./core/archetypes/Venture.js:229:    const NEI = await DB.advLocations.traceRoutes(location, 0);
 - ./core/archetypes/Venture.js:230:    const LOCS = await DB.advLocations.find({ id: { $in: NEI.map((x) => x._id) } }).lean();
 - ./core/archetypes/Venture.js:256:    const playerCount = await DB.advJourneys.countDocuments({ location, end: { $gt: Date.now() } });
 - ./core/commands/beta/debug.js:36:    DB.users.findOne({ id: msg.author.id }).then((x) => {
 - ./core/commands/beta/debug.js:46:    DB.users.findOne({ id: msg.author.id }).then((x) => {
 - ./core/commands/beta/vdiff.js:4:        DB.users.findOne({ id: msg.author.id }).noCache(),
 - ./core/commands/beta/vdiff.js:5:        DB.userInventory.get(msg.author.id),
 - ./core/commands/beta/vdiff.js:8:    const vanillaUserData = (await vDB.users.findOne({ id: msg.author.id }).noCache())._doc;
 - ./core/commands/cosmetics/background.js:12:  let BGBASE = await DB.cosmetics.bgs();
 - ./core/commands/cosmetics/background.js:56:    DB.users.get(msg.author.id),
 - ./core/commands/cosmetics/background.js:57:    DB.userInventory.get(msg.author.id),
 - ./core/commands/cosmetics/craft.js:35:    const userDiscoveries = (await DB.userInventory.get(msg.author.id))?.inventory?.filter((itm) => itm.crafted).map((itm) => itm.id) || [];
 - ./core/commands/cosmetics/favcolor.js:14:    const uData = await DB.users.get(usery.id);
 - ./core/commands/cosmetics/fragment.js:22:    DB.users.get({ id: msg.author.id }),
 - ./core/commands/cosmetics/fragment.js:23:    DB.userInventory.getFull(msg.author.id),
 - ./core/commands/cosmetics/fragment.js:29:    BASE = await DB.cosmetics.find({ type: "background", code: { $in: cosmeticsDoc?.bgInventory || [] } });
 - ./core/commands/cosmetics/fragment.js:34:    BASE = await DB.cosmetics.find({ type: "medal", icon: { $in: cosmeticsDoc?.medalInventory || [] } });
 - ./core/commands/cosmetics/fragment.js:39:    BASE = await DB.cosmetics.find({ type: "sticker", id: { $in: cosmeticsDoc?.stickerInventory || [] } });
 - ./core/commands/cosmetics/lootbox_generator.js:73:  const COSMETICSDATA = await DB.userInventory.get(msg.author.id);
 - ./core/commands/cosmetics/lootbox_generator.js:90:  const boxparams = await DB.items.findOne({ id: args?.boxID || "lootbox_C_O" });
 - ./core/commands/cosmetics/medalinfo.js:7:  const mdi = await DB.cosmetics.find({ type: "medal" });
 - ./core/commands/cosmetics/openbooster.js:7:    DB.users.getFull({ id: msg.author.id }),
 - ./core/commands/cosmetics/openbooster.js:8:    DB.cosmetics.find({ type: "sticker" }),
 - ./core/commands/cosmetics/openbooster.js:9:    DB.items.find({ type: "boosterpack" }),
 - ./core/commands/cosmetics/openbooster.js:10:    DB.userInventory.getFull(msg.author.id),
 - ./core/commands/cosmetics/synthesize/any.js:4:    let BASE = await DB.cosmetics.find({
 - ./core/commands/cosmetics/synthesize/index.js:20:  const userData = await DB.users.getFull({ id: message.author.id });
 - ./core/commands/cosmetics/synthesize/synthBg.js:5:  const cosmeticsData = await DB.userInventory.get(userData.id);
 - ./core/commands/cosmetics/synthesize/synthMedal.js:5:  const cosmeticsData = await DB.userInventory.get(userData.id);
 - ./core/commands/economy/balance.js:25:    DB.userInventory.get(Target.id),
 - ./core/commands/economy/balance.js:77:    lastTrans = await DB.audits.find({ $or: [{ from: TARGETDATA.id }, { to: TARGETDATA.id }] }).sort({ timestamp: -1 }).limit(5);
 - ./core/commands/economy/daily.js:54:    DB.users.getFull(msg.author.id),
 - ./core/commands/economy/daily.js:247:        const BOOSTERS = await DB.items.find({ type: "boosterpack", rarity: { $in: ["C", "U", "R"] } });
 - ./core/commands/economy/daily.js:292:    // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/economy/daily.js:297:    // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/economy/daily.js:303:      // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/economy/daily.js:312:      // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/economy/givebox.js:19:  const [USERDATA] = await DB.users.get(msg.author.id);
 - ./core/commands/economy/givebox.js:48:      DB.users.getFull({ id: msg.author.id }),
 - ./core/commands/economy/givebox.js:49:      DB.users.getFull({ id: Target.id }),
 - ./core/commands/economy/givebox.js:50:      DB.items.find({ type: "box" }),
 - ./core/commands/economy/marketplace/list.js:74:      (await DB.marketbase({ fullbase: 1 })).fullbase,
 - ./core/commands/economy/marketplace/list.js:75:      DB.marketplace.find(query).countDocuments(),
 - ./core/commands/economy/marketplace/list.js:84:    const pagecontent = await DB.marketplace.find(query).limit(12).skip(12 * ((page || 1) - 1)).lean();
 - ./core/commands/economy/marketplace/post.js:44:      DB.users.getFull({ id: msg.author.id }),
 - ./core/commands/economy/marketplace/post.js:45:      DB.userInventory.getFull(msg.author.id),
 - ./core/commands/economy/marketplace/post.js:120:    const validItem = await DB.items.findOne(itemFindQuery);
 - ./core/commands/economy/marketplace/post.js:121:    const checkCosmetic = await DB.cosmetics.findOne({
 - ./core/commands/economy/transfer.js:18:    DB.users.get(msg.author.id),
 - ./core/commands/economy/transfer.js:19:    DB.users.get(TARGET.id),
 - ./core/commands/fun/responses.js:59:  const serverResps = DB.responses.findOne({ server: msg.guild.id }).noCache();
 - ./core/commands/games/airline/new.js:6:const STARTER_AIRPORTS_OPTIONS = DB.airlines.AIRPORT.find({ starter: true });
 - ./core/commands/games/airline/new.js:7:const STARTER_AIRPLANE_OPTIONS = DB.airlines.AIRPLANES.find({ starter: true });
 - ./core/commands/games/airline/new.js:40:  const existent = await DB.airlines.AIRLINES.findOne({ id: airlineID });
 - ./core/commands/games/airline/routes/new.js:38:    const port = await DB.airlines.AIRPORT.findOne({ IATA: airlineId });
 - ./core/commands/games/betflip.js:10:  const userData = await DB.users.get(msg.author.id);
 - ./core/commands/games/blackjack.js:259:    DB.users.get(msg.author.id),
 - ./core/commands/games/blackjack.js:260:    DB.userInventory.get(msg.author.id),
 - ./core/commands/games/blackjack.js:272:  const DECKDATA = await DB.cosmetics.find({ type: "skin", for: "casino" });
 - ./core/commands/games/blackjack.js:581:  const USERDATA = await DB.users.get(msg.author.id);
 - ./core/commands/games/highscores/flags.js:4:    const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? "guessflag-server" : "", args[0] == "solo" || !args[0] ? "guessflag-solo" : ""] } }).sort({ points: -1 }).limit(10);
 - ./core/commands/games/highscores/_generic.js:4:  const RANKS = await DB.rankings
 - ./core/commands/games/highscores.js:21:  const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? "guessflag-server" : "", args[0] == "solo" || !args[0] ? "guessflag-solo" : ""] } }).sort({ points: -1 }).limit(10);
 - ./core/commands/img/kiss.js:49:  const userData = Target ? await DB.users.findOne({ id: msg.author.id }).lean() : null;
 - ./core/commands/img/kiss.js:50:  const marriedtarget = await DB.relationships.find({ users: msg.author.id });
 - ./core/commands/infra/migfix.js:5:    const userData_OLD = await vDB.users.findOne({ id: msg.author.id }).noCache().lean();
 - ./core/commands/infra/migfix.js:6:    const userData_NEW = await DB.users.findOne({ id: msg.author.id }).noCache();
 - ./core/commands/infra/migfix.js:16:        // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/infra/migfix.js:33:        // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/infra/migrate.js:39:  const userData_OLD = await vDB.users.findOne({ id: msg.author.id }).noCache().lean();
 - ./core/commands/infra/migrate.js:40:  const userData_NEW = await DB.users.findOne({ id: msg.author.id }).noCache().lean();
 - ./core/commands/infra/migrate.js:166:          // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/infra/migrate.js:168:          // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/infra/migrate.js:275:          const myBGsFULL = await DB.cosmetics.find({ code: { $in: myBGs } }).lean();
 - ./core/commands/infra/migrate.js:327:              // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/infra/migrate.js:403:      let neodata = await DB.users.get(msg.author.id);
 - ./core/commands/infra/prime.js:3:  const USERDATA = await DB.users.get(msg.author.id);
 - ./core/commands/infra/prime.js:37:    const SVdata = await DB.servers.findOne({ id: primeServerId }).lean();
 - ./core/commands/infra/status.js:71:		description: `Patch [\`v${ver}\`](https://ptb.discord.com/channels/277391723322408960/712055672799232092 "See patch notes • ${commit}") | Database \`${DB.version}\` | Engine \`Eris v${PLX.engine.VERSION}\``,
 - ./core/commands/infra/transactionlookup.js:7:  const log = await DB.audits.get({ transactionId: filterid });
 - ./core/commands/infra/transactionlookup.js:25:    ? (await DB.users.get({ id: log.to }))?.meta
 - ./core/commands/infra/transactionlookup.js:26:    : (await DB.users.getFull({ id: log.from }))?.meta;
 - ./core/commands/infra/transactionlookup.js:49:    const ouser = (await DB.users.findOne({ id: log.to }))?.meta || log.to;
 - ./core/commands/inventory/decks.js:8:      DB.cosmetics.find({ type: "skin", for: "casino" }),
 - ./core/commands/inventory/decks.js:9:      DB.userInventory.get(msg.author.id),
 - ./core/commands/inventory/inventory.js:49:    DB.users.get(Target.id, {
 - ./core/commands/inventory/inventory.js:53:    DB.items.find().lean().exec(),
 - ./core/commands/inventory/inventory.js:54:    DB.userInventory.get(Target.id),
 - ./core/commands/inventory/use.js:5:    DB.users.getFull(msg.author.id),
 - ./core/commands/inventory/use.js:6:    DB.userInventory.getFull(msg.author.id),
 - ./core/commands/inventory/use.js:17:      const itemDetails = DB.items.get(ITEM);
 - ./core/commands/misc/activateprime.js:6:  const USERDATA = await DB.users.get(msg.author.id);
 - ./core/commands/misc/activateprime.js:23:  const SVdata = (await DB.servers.findOne({ id: msg.args[0] }).lean()) || await vDB.servers.findOne({ id: msg.args[0] }).lean();
 - ./core/commands/misc/claimtokens.js:5:    const oldUser = await vDB.users.findOne({ id: msg.author.id });
 - ./core/commands/misc/errandfix.js:4:    const userData = await DB.users.get(msg.author.id);
 - ./core/commands/misc/errandfix.js:5:    const errandsData = await DB.quests.find({ id: { $in: userData.quests?.map(e => e.id) } }).noCache().lean();
 - ./core/commands/misc/inventmigrate.js:3:  const userData = await DB.users.get(msg.author.id);
 - ./core/commands/misc/inventmigrate.js:5:  // TODO(sunset): migrate to DB.userInventory
 - ./core/commands/misc/mrgt.js:5:	const USERDATA = await vDB.users.get(msg.author.id);
 - ./core/commands/misc/mrgt.js:6:	const newUserData = await DB.users.get(msg.author.id);
 - ./core/commands/misc/mrgt.js:11:		const rships = await DB.relationships.find({users: msg.author.id});
 - ./core/commands/misc/mrgt.js:29:		newmar.preexistent = await DB.relationships.findOne({ users: { $all: [msg.author.id, mar.id] } });
 - ./core/commands/misc/mrgt.js:161:			const newM = DB.relationships.create("marriage", thisMrg.users, thisMrg.initiative, thisMrg.ring, thisMrg.since);
 - ./core/commands/moderation/ban.js:14:  const serverData = await DB.servers.get(msg.guild.id);
 - ./core/commands/moderation/clear.js:6:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./core/commands/moderation/kick.js:8:  const serverData = await DB.servers.get(msg.guild.id);
 - ./core/commands/moderation/lang.js:24:  const serverData = await DB.servers.get(msg.guild.id);
 - ./core/commands/moderation/mute.js:17:  let ServerDATA = await DB.servers.get(Server.id);
 - ./core/commands/moderation/mute.js:20:    await DB.servers.get(Server.id);
 - ./core/commands/moderation/mute.js:214:    DB.mutes.add({ S: Mem.guild.id, U: Mem.id, E: freedom });
 - ./core/commands/moderation/paidroles.js:15:  const serverData = await DB.servers.get(msg.guild.id, { "modules.MODROLE": 1 });
 - ./core/commands/moderation/paidroles.js:20:  const roleMarket = await DB.paidroles.find({ server: msg.guild.id }).lean();
 - ./core/commands/moderation/purge.js:8:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./core/commands/moderation/reactionroles.js:13:  const serverData = await DB.servers.get(msg.guild.id, { "modules.MODROLE": 1 });
 - ./core/commands/moderation/reactionroles.js:75:  const ReactionData = await DB.reactRoles.find({ server: msg.guild.id });
 - ./core/commands/pollux/adventure.js:123:  const LOCATIONS_B = await DB.advLocations.traceRoutes("LSGC", durationChoice);
 - ./core/commands/pollux/adventure.js:154:  //const userData = await DB.users.get(msg.author.id);
 - ./core/commands/pollux/adventure.js:158:  const playersHere = await DB.advJourneys.find({ location: selectedLocation._id, end: { $gt: Date.now() } }).lean();
 - ./core/commands/pollux/errands/forfeit.js:8:    const userData = await DB.users.get(msg.author.id);
 - ./core/commands/pollux/errands/forfeit.js:16:        let errandsData = await DB.quests.find({ id: { $in: notCompleted.map(e => e.id) } }).noCache().lean();
 - ./core/commands/pollux/errands/index.js:43:    let errandsData = await DB.quests.find({ id: { $in: userErrands.map(e => e.id) } }).noCache().lean();
 - ./core/commands/roleplay/attribute.js:18:  let USERDATA = await DB.users.getFull({ id: message.author.id });
 - ./core/commands/roleplay/attribute.js:51:  USERDATA = await DB.users.getFull({ id: message.author.id });
 - ./core/commands/roleplay/roll.js:28:  const userDATA = await DB.users.get({ id: message.author.id });
 - ./core/commands/social/buyrole.js:4:  const roleMarket = await DB.paidroles.find({ server: msg.guild.id }).lean();
 - ./core/commands/social/buyrole.js:15:  const userData = await DB.users.get(msg.author.id);
 - ./core/commands/social/buyrole.js:27:    DB.temproles.add({
 - ./core/commands/social/commend.js:14:    DB.users.findOne({ id: msg.author.id }),
 - ./core/commands/social/commend.js:15:    DB.userInventory.getFull(msg.author.id),
 - ./core/commands/social/commend.js:17:  const targetData = (await DB.commends.parseFull({ id: Target.id })) || {
 - ./core/commands/social/commend.js:68:      DB.commends.add(userData.id, Target.id, 1),
 - ./core/commands/social/commend.js:130:  const targetData = (await DB.commends.parseFull({ id: Target.id })) || {
 - ./core/commands/social/commend.js:136:  const metas = await DB.users
 - ./core/commands/social/divorce.js:4:  const marriages = await DB.relationships.find({
 - ./core/commands/social/divorce.js:31:          label: (await DB.users.getFull(uID)).tag,
 - ./core/commands/social/divorce.js:91:  const user = await DB.users.getFull(msg.author.id);
 - ./core/commands/social/divorce.js:92:  const partner = await DB.users.getFull(toDivorceUserId);
 - ./core/commands/social/divorce.js:164:  await DB.relationships.findByIdAndDelete(marriage._id);
 - ./core/commands/social/divorce.js:232:  await DB.relationships.findByIdAndDelete(marriage._id);
 - ./core/commands/social/gift/give.js:2:  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - ./core/commands/social/gift/inventory.js:2:  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - ./core/commands/social/gift/open.js:4:  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - ./core/commands/social/gift/open.js:8:  const userData = await DB.users.get(msg.author.id);
 - ./core/commands/social/gift/open.js:12:  const dbItemData = await DB.cosmetics.get({[giftMetadata.finder]:gift.item});
 - ./core/commands/social/gift/peek.js:5:    const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - ./core/commands/social/gift/peek.js:8:    const userData = await DB.users.get(msg.author.id);
 - ./core/commands/social/gift/wrap.js:26:  const userData = await DB.users.getFull({ id: msg.author.id });
 - ./core/commands/social/leaderboards.js:8:  return DB.users.find({}, PROJECTION).sort({ "progression.exp": -1 })
 - ./core/commands/social/leaderboards.js:13:  const lRanks = await DB.localranks.find({ server }).sort({ exp: -1 })
 - ./core/commands/social/leaderboards.js:15:  const dbRankData = await DB.users.find({ id: { $in: lRanks.map((u) => u.user) } }, PROJECTION).lean();
 - ./core/commands/social/leaderboards.js:38:    // DB.servers.get(Server.id),
 - ./core/commands/social/leaderboards.js:40:    DB.users.get(msg.author.id),
 - ./core/commands/social/leaderboards.js:41:    DB.localranks.get({ server: msg.guild.id, user: msg.author.id }),
 - ./core/commands/social/leaderboards.js:46:      ? await DB.localranks.find({ server: msg.guild.id, exp: { $gt: selfLocal.exp } }, { _id: 1 }).count()
 - ./core/commands/social/leaderboards.js:47:      : await DB.users.find({ "progression.exp": { $gt: userData.progression.exp } }, { _id: 1 }).count());
 - ./core/commands/social/level.js:6:const userDB = DB.users;
 - ./core/commands/social/level.js:7:const serverDB = DB.servers;
 - ./core/commands/social/level.js:48:  const TARGET_DB = await userDB.findOne({ id: Target.id });
 - ./core/commands/social/level.js:49:  const SV_DB = await serverDB.findOne({ id: Server.id });
 - ./core/commands/social/level.js:51:  const favcolor = TARGET_DB.profile.favcolor || "#eb11da";
 - ./core/commands/social/level.js:58:  const exp = TARGET_DB.progression.exp || 0;
 - ./core/commands/social/level.js:59:  const level = TARGET_DB.progression.level || 0;
 - ./core/commands/social/level.js:73:    l_exp = (await DB.localranks.get({ user: Target.id, server: msg.guild.id })).exp || 0;
 - ./core/commands/social/level.js:74:    l_level = (await DB.localranks.get({ user: Target.id, server: msg.guild.id })).level || 0;
 - ./core/commands/social/marry.js:24:	const userMarriages = await DB.relationships.find({ type: "marriage", users: msg.author.id });
 - ./core/commands/social/marry.js:39:		DB.users.getFull(msg.author.id),
 - ./core/commands/social/marry.js:40:		DB.userInventory.get(msg.author.id),
 - ./core/commands/social/marry.js:44:	const userInventoryFull = await DB.items.find( {series:"ring", id: { $in: inventoryIDmap}} ).lean();
 - ./core/commands/social/marry.js:155:		const marriages = await DB.relationships.find({ type: "marriage", users: msg.author.id });
 - ./core/commands/social/marry.js:210:		const THIS_MARRIAGE_ID = (await DB.relationships.create("marriage", [msg.author.id, Target.id], msg.author.id, selectedRing.id))._id;
 - ./core/commands/social/marry.js:331:	const userMarriages = await DB.relationships.find({users: user });
 - ./core/commands/social/marry.js:348:							DB.items.findOne({ id: mrg.ring }).lean().exec()
 - ./core/commands/social/marry.js:410:		DB.users.getFull(msg.author.id),
 - ./core/commands/social/marry.js:411:		DB.userInventory.get(msg.author.id),
 - ./core/commands/social/marry.js:415:	const userInventoryFull = await DB.items.find( {series:"ring", id: { $in: inventoryIDmap}} ).lean();
 - ./core/commands/social/marry.js:458:				selectedRing = await DB.items.findOne({id: val});
 - ./core/commands/social/marry.js:462:				selectedRel = await DB.relationships.findOne({_id: val.toString()});
 - ./core/commands/social/marry.js:480:	const userData = await DB.users.get(msg.author.id);
 - ./core/commands/social/marry.js:507:				selectedRing = await DB.items.findOne({id: val});
 - ./core/commands/social/marry.js:514:				selectedRel = await DB.relationships.findOne({_id: val});
 - ./core/commands/social/marry.js:515:				selectedRing = await DB.items.findOne({id: selectedRel.ring});
 - ./core/commands/social/marry.js:522:				const ringsCol = await DB.items.find({id:{$in: selectedRel.ringCollection }});
 - ./core/commands/social/personaltext.js:7:  const userData = await DB.users.findOne({ id: msg.author.id });
 - ./core/commands/social/profile-v1.js:138:    const dDATA = await DB.users.get(msg.author.id);
 - ./core/commands/social/profile-v1.js:170:  let Target_Database = await DB.users.get({ id: Target.id });
 - ./core/commands/social/profilelink.js:6:  const userdata = await DB.users.getFull({ id: TARGET.id });
 - ./core/commands/social/rank.js:11:    userData = await DB.users.get(TARGET.id),
 - ./core/commands/social/rank.js:12:    serverData = await DB.servers.get(msg.guild.id),
 - ./core/commands/social/rank.js:13:    selfLocal = await DB.localranks.get({ user: TARGET.id, server: msg.guild.id }),
 - ./core/commands/social/rank.js:72:  LRpos = await DB.localranks.find({ server: msg.guild.id, exp: { $gt: selfLocal.exp } }, { _id: 1 }).countDocuments();
 - ./core/commands/social/roleme.js:2:	const GUILD = await DB.servers.findOne({ id: msg.guild.id });
 - ./core/commands/social/tagline.js:7:  const userData = await DB.users.findOne({ id: msg.author.id });
 - ./core/commands/social/thanks.js:17:    const TargetServerData = await DB.localranks.findOne({ user: Target.id, server: msg.guild.id }).noCache()
 - ./core/commands/social/thanks.js:80:        const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./core/commands/social/top.js:17:  const userData = await DB.users.get(m.author.id);
 - ./core/commands/social/top.js:20:  const myCommends = await DB.commends.parseFull(m.author.id);
 - ./core/commands/social/top.js:23:      DB.commends.aggregate([{ $group: { _id: "$from", total: { $sum: "$count" } } }, { $sort: { total: -1 } }, { $limit: 10 }]),
 - ./core/commands/social/top.js:24:      DB.commends.aggregate([{ $group: { _id: "$to", total: { $sum: "$count" } } }, { $sort: { total: -1 } }, { $limit: 10 }]),
 - ./core/commands/social/top.js:25:      ((await DB.commends.aggregate([{ $group: { _id: "$to", total: { $sum: "$count" } } }, { $match: { total: { $gt: myCommends.totalIn } } }, { $count: "COUNT" }]))[0]?.COUNT || 0) + 1,
 - ./core/commands/social/top.js:26:      ((await DB.commends.aggregate([{ $group: { _id: "$from", total: { $sum: "$count" } } }, { $match: { total: { $gt: myCommends.totalOut } } }, { $count: "COUNT" }]))[0]?.COUNT || 0) + 1,
 - ./core/commands/social/top.js:98:  const rank = await DB.localranks.find({ server: msg.guild.id, thx: { $gt: 0 } }).sort({ thx: -1 }).limit(10).lean();
 - ./core/commands/utility/chdeck.js:17:    const userChannelDeck = (await DB.users.get(msg.author.id)).switches?.channeldeck || [];
 - ./core/commands/utility/pin.js:6:  const serverData = await DB.servers.get(msg.guild.id);
 - ./core/commands/utility/reminder.js:21:  const userReminders = await DB.feed.find({ url: msg.author.id }).lean();
 - ./core/commands/utility/rss.js:11:	const feedData = await DB.feed.find({ server: msg.guild.id, type: "rss" }).lean()
 - ./core/commands/utility/rss.js:39:		await DB.feed["new"](payload);
 - ./core/commands/utility/say.js:10:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./core/commands/utility/saytochannel.js:6:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./core/commands/utility/tag.js:7:  const tagObj = await DB.responses.findOne({server:msg.guild.id,tag});
 - ./core/commands/utility/tag.js:63:  const serverResps = await DB.responses.findOne({ server:msg.guild.id, tag }).noCache();
 - ./core/commands/utility/tag.js:81:  const preexistingItem = await DB.responses.findOne({ server:msg.guild.id, tag }).noCache();
 - ./core/commands/utility/twitchalert.js:32:    const feedData = await DB.feed.find({ server: msg.guild.id, type: "twitch" });
 - ./core/commands/utility/weather.js:36:		args[0] = (await DB.users.get(msg.author.id, { personal: 1 })).personal?.city;
 - ./core/commands/utility/ytalert.js:18:  const feedData = await DB.feed.find({ server: msg.guild.id, type: "youtube" });
 - ./core/commands/_botOwner/primerollout.js:10:    const thisSticker = await DB.cosmetics.findOne({ id: composeStickerName() }).noCache();
 - ./core/commands/_botStaff/eval.js:9:    .replace(DB.native.host, "[REDACTED]")
 - ./core/commands/_botStaff/eval.js:10:    .replace(DB.native.name, "[REDACTED]")
 - ./core/commands/_botStaff/eval.js:11:    .replace(DB.native.port, "[REDACTED]")
 - ./core/commands/_botStaff/eval.js:12:    .replace(DB.native.pass, "[REDACTED]")
 - ./core/commands/_botStaff/fanartApprove.js:6:    let Fanart = await DB.fanart.findOne({ hash });
 - ./core/commands/_botStaff/lvup.js:36:    const userData = await DB.users.get(msg.author.id);
 - ./core/structures/CommandPreprocessor.js:125:        await DB.users.findOne({ "prime.servers": m.guild.id }).cache()
 - ./core/structures/CommandPreprocessor.js:175:    const knownError = await DB.globals.findOne({code: errorCode, type: "errorCode", known: true });
 - ./core/structures/Premium.js:8:      DB.users.get(user.id).then((usr) => {
 - ./core/structures/TimedUsage.js:24:    const USERDATA = await DB.users.get({ id: user.id }, undefined, "users");
 - ./core/structures/_legacy_userdb_shim.js:13: *  2. This is the ONLY file allowed to reference DB._legacyUserDB.
 - ./core/structures/_legacy_userdb_shim.js:16: *     DB._legacyUserDB / DB.userDB exports from database_schema.
 - ./core/structures/_legacy_userdb_shim.js:55: * @deprecated Use DB.users.get() directly when all users are migrated.
 - ./core/structures/_legacy_userdb_shim.js:65:  const user = await DB.users.get(userId, projection);
 - ./core/structures/_legacy_userdb_shim.js:71:    legacyUser = await DB._legacyUserDB.findOne({ id: userId }).lean();
 - ./core/structures/_legacy_userdb_shim.js:96: * @deprecated Use DB.users.getFull() directly when all users are migrated.
 - ./core/structures/_legacy_userdb_shim.js:104:  const user = await DB.users.getFull(userId);
 - ./core/structures/_legacy_userdb_shim.js:114:    legacyUser = await DB._legacyUserDB.findOne({ id: userId }).lean();
 - ./core/structures/_legacy_userdb_shim.js:132:  return DB.users.getFull(userId);
 - ./core/structures/_legacy_userdb_shim.js:138: * @deprecated Use DB.userInventory.get() directly when all users are migrated.
 - ./core/structures/_legacy_userdb_shim.js:146:  const cosmetics = await DB.userInventory.get(userId);
 - ./core/structures/_legacy_userdb_shim.js:152:    legacyUser = await DB._legacyUserDB.findOne(
 - ./core/structures/_legacy_userdb_shim.js:190: * @deprecated Use DB.userInventory.getFull() directly when all users are migrated.
 - ./core/structures/_legacy_userdb_shim.js:198:  let doc = await DB.userInventory.getFull(userId);
 - ./core/structures/_legacy_userdb_shim.js:214:  return DB.userInventory.getFull(userId);
 - ./core/structures/_legacy_userdb_shim.js:220: * @deprecated Use DB.userOAuth.get() directly when all users are migrated.
 - ./core/structures/_legacy_userdb_shim.js:228:  const oauth = await DB.userOAuth.get(userId);
 - ./core/structures/_legacy_userdb_shim.js:233:    legacyUser = await DB._legacyUserDB.findOne(
 - ./core/subroutines/boxDrops.js:79:  const inFlight = DB.servers.findOne({ id: guildId }).lean().exec()
 - ./core/subroutines/boxDrops.js:335:      await DB.users.getFull({ id: luckyOne.id }).then((userdata) => userdata.addItem(BOX.id));
 - ./core/subroutines/customResponses.js:15:	const gResps = await DB.responses.find({ server: msg.guild.id }).noCache() || [];
 - ./core/subroutines/feeds/index.js:18:  DB.feed.find({ server: {$in: allGuilds } }).lean().then(async (/** @type {Feed[]} */serverFeeds) => {
 - ./core/subroutines/feeds/index.js:20:    const servers = await DB.servers.find({ id: { $in: serverFeeds.map((f) => f.server) } }, { "modules.LANGUAGE": 1, id: 1 }).lean();
 - ./core/subroutines/globalLevelUp.js:41:	userData ??= await DB.users.getFull(msg.author.id);
 - ./core/subroutines/localLevelUp.js:3:const getLocalRank = (GID,UID) => DB.localranks.findOne({ user: UID, server: GID }).noCache();
 - ./core/subroutines/localLevelUp.js:29:	DB.localranks.incrementExp({ U: userID, S: serverID });
 - ./core/subroutines/microtasks/serverCache.js:13:    return DB.servers.find(query).lean().exec().then((servers) => {
 - ./core/subroutines/microtasks/serverCache.js:44:    return DB.channels.find(query).lean().exec().then((channels) => {
 - ./core/subroutines/onEveryMessage.js:26:    msg.guild.serverData = await DB.servers.findOne({ id: msg.guild.id }).cache();
 - ./core/utilities/Gearbox/client.js:14:        if (enforceDB && !(await DB.users.get(ID))) return Promise.reject("USER NOT IN DB");
 - ./core/utilities/Gearbox/client.js:37:        if (enforceDB && !(await DB.users.get(ID))) return Promise.reject( new Error("USER NOT IN DB") );
 - ./core/utilities/Premium.js:21:      DB.users.get(user.id).then((usr) => {
 - ./DB_Interactions.md:5:> **Note:** at the time of writing the bot accesses the database indirectly via the `DB`/`vDB` connection objects returned by `@polestarlabs/database_schema`.  Most read/write operations live in helper modules, subroutines, or command files (see `core/`) and are performed through shared packages under `node_modules`.  The only **direct** `DB.` call inside this repository is the blacklist fallback in `pollux.js`; every other interaction occurs in the modules listed below.  For migration, each of these must be replaced by the appropriate dashboard API endpoint.
 - ./DB_Interactions.md:24:| `core/commands/infra/*` | users, vDB.users, servers, audits, etc. | both | R/W | ❓ (migration utilities likely no) | ✅ yes |
 - ./DB_Interactions.md:40:core/archetypes/Premium.js: ... DB.users.set ...
 - ./DB_Interactions.md:43:core/archetypes/Switch.js: ... DB.servers.get ... DB.channels.get/new ... DB.servers.set ... DB.channels.set ...
 - ./DB_Interactions.md:44:core/archetypes/UserProfileModel.js: ... DB.users ... DB.localranks.get ... DB.relationships.findOne ...
 - ./DB_Interactions.md:45:core/archetypes/Venture.js: ... DB.advLocations.findOne/traceRoutes/find ... DB.advJourneys.countDocuments ...
 - ./DB_Interactions.md:46:core/commands/beta/debug.js: DB.users.set/findOne ...
 - ./DB_Interactions.md:47:core/commands/beta/vdiff.js: DB.users.findOne/noCache ... DB.userInventory.get ...
 - ./DB_Interactions.md:51:core/commands/img/kiss.js: DB.users.findOne ... DB.relationships.find ... DB.relationships.set ...
 - ./DB_Interactions.md:55:-sidecar.js cron jobs: DB.temproles, DB.mutes, DB.feed
 - ./DB_Interactions.md:68:4. **Bot modifications:** each `DB.*` call in the bot code will be replaced by an HTTP client request (e.g. `PLX.api.get(…)` or `PLX.api.post(…)`) matching the new endpoint names. A wrapper library may abstract the translation.
 - ./DB_Interactions.md:75: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:4:let ACHIEVEMENTS = DB.achievements.find({}).noCache().lean().then(a => ACHIEVEMENTS = a);
 - ./DB_Interactions.md:76: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:15:    await DB.achievements.award(user, achievement);
 - ./DB_Interactions.md:77: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:24:    //  return !!(await DB.progression.get({achievement,user,type:'achievement'})).awarded;
 - ./DB_Interactions.md:78: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:59:      if ((!userData?.modules && userData.id) || typeof userData === "string") userData = await DB.users.findOne({ id: userData.id || userData }).noCache().lean();
 - ./DB_Interactions.md:79: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:62:      const statistics = (await DB.control.findOne({ id: userData.id }).noCache())?.data?.statistics;
 - ./DB_Interactions.md:80: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:137:    const userData = await DB.users.get(uID);
 - ./DB_Interactions.md:81: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:6:    this.airline = DB.airlines.AIRLINES.findOne({ id });
 - ./DB_Interactions.md:82: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:11:    const airportData = await DB.airlines.AIRPORT.findOne({ id: airport });
 - ./DB_Interactions.md:83: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:14:    await DB.airlines.SLOTS.validate((await (this.airline)).id, airportData.id).then(ok=>{
 - ./DB_Interactions.md:84: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:26:    const airplaneData = await DB.airlines.AIRPLANES.findOne({ id });
 - ./DB_Interactions.md:85: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:30:      return DB.airlines.AIRPLANES.buy((await this.airline).id, airplaneData.id);
 - ./DB_Interactions.md:86: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:43:    return DB.airlines.ROUTES.shutdown(route);
 - ./DB_Interactions.md:87: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:12:  return DB.items.find({}).lean().then((ALLITEMS) => {
 - ./DB_Interactions.md:88: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:94:      DB.users.getFull({ id: userid }),
 - ./DB_Interactions.md:89: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:95:      DB.users.get(userid),
 - ./DB_Interactions.md:90: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:96:      DB.userInventory.get(userid),
 - ./DB_Interactions.md:91: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:477:    let initialItems = await DB.items.find({
 - ./DB_Interactions.md:92: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:205:  return DB.users.get(uID).then((  /** @type { { currency: {[K in Currency]:number} } | null } */ userData) => {
 - ./DB_Interactions.md:93: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:400: * NOTE: this will immediately end up in DB.
 - ./DB_Interactions.md:94: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Inventory.js:10:      DB.items.find({ type: this.invType }).lean().exec().then((boxes) => resolve(boxes));
 - ./DB_Interactions.md:95: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Inventory.js:14:  getUserData() { return DB.users.get(this.userID); }
 - ./DB_Interactions.md:96: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:312:const PREMIUM_STICKERS = DB.cosmetics.find({ public: true, GROUP: "plx_collection" }).noCache()
 - ./DB_Interactions.md:97: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:314:const PREMIUM_PACKS = DB.items.find({ type: "boosterpack", filter: "plx_collection" }).noCache()
 - ./DB_Interactions.md:98: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:391:  const userData = (await DB.users.findOne({ id: mansionMember.id }).noCache())?._doc;
 - ./DB_Interactions.md:99: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:458:  const userData = await DB.users.findOne({ id: userID }).noCache();
 - ./DB_Interactions.md:100: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:459:  const cosmeticsData = await DB.userInventory.get(userID);
 - ./DB_Interactions.md:101: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:514:  // cosmetics ops (inventory, flairs, medals) go to DB.userInventory separately
 - ./DB_Interactions.md:102: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:711:  const usr = await DB.users.get(userID);
 - ./DB_Interactions.md:103: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:125:        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; //this.userQuestsCache.get(userID);
 - ./DB_Interactions.md:104: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:127:            const userData = await DB.users.findOne({ id: userID }).noCache().lean() || [];
 - ./DB_Interactions.md:105: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:202:        let quest = await DB.quests.get(questID);
 - ./DB_Interactions.md:106: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:211:        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; // this.userQuestsCache.get(userID) || [];
 - ./DB_Interactions.md:107: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:218:        const userData = await DB.users.findOne({ id: userID }).noCache().lean();
 - ./DB_Interactions.md:108: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:223:        let quests = (await DB.users.findOne({ id: userID }).noCache().lean())?.quests; //this.userQuestsCache.get(userID) || [];
 - ./DB_Interactions.md:109: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:230:        const userData = await DB.users.findOne({ id: userID }).noCache().lean();
 - ./DB_Interactions.md:110: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:232:        return (await DB.quests.find({ public: true, reveal_level: { $lte: userData.progression.level } }).lean());
 - ./DB_Interactions.md:111: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:300:    const quest = await DB.quests.get(userQuest.id);
 - ./DB_Interactions.md:112: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:301:    const currentUserQuests = (await DB.users.findOne({ id: userID }, { quest: 1 }).noCache())?.quests || [];
 - ./DB_Interactions.md:113: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:11:    this.data = await DB.promocodes.findOne({ code: this.code }).lean();
 - ./DB_Interactions.md:114: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:160:      let redata = await DB.promocodes.findOne({ code }).lean();
 - ./DB_Interactions.md:115: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:169:    const userData = await DB.users.getFull(this.user);
 - ./DB_Interactions.md:116: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:180:      const prizeItem = DB.cosmetics.get( Object.assign({
 - ./DB_Interactions.md:117: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:143:      DB.servers.get(this._guild.id),
 - ./DB_Interactions.md:118: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:144:      DB.channels.get(this._channel.id),
 - ./DB_Interactions.md:119: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:53:    return DB.users
 - ./DB_Interactions.md:120: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:63:      DB.commends.parseFull(this.ID)
 - ./DB_Interactions.md:121: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:79:      return DB.localranks.get({ user: this.ID, server: this.server }).then(async (svRankData) => {
 - ./DB_Interactions.md:122: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:81:        this.localRank = await DB.localranks
 - ./DB_Interactions.md:123: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/UserProfileModel.js:91:      let marriage = this.marriage || await DB.relationships.findOne({ type: "marriage", _id: this.featMarriage });
 - ./DB_Interactions.md:124: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Venture.js:227:    const LOC = await DB.advLocations.findOne({ id: location }).lean();
 - ./DB_Interactions.md:125: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Venture.js:229:    const NEI = await DB.advLocations.traceRoutes(location, 0);
 - ./DB_Interactions.md:126: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Venture.js:230:    const LOCS = await DB.advLocations.find({ id: { $in: NEI.map((x) => x._id) } }).lean();
 - ./DB_Interactions.md:127: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Venture.js:256:    const playerCount = await DB.advJourneys.countDocuments({ location, end: { $gt: Date.now() } });
 - ./DB_Interactions.md:128: - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:36:    DB.users.findOne({ id: msg.author.id }).then((x) => {
 - ./DB_Interactions.md:129: - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:46:    DB.users.findOne({ id: msg.author.id }).then((x) => {
 - ./DB_Interactions.md:130: - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/vdiff.js:4:        DB.users.findOne({ id: msg.author.id }).noCache(),
 - ./DB_Interactions.md:131: - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/vdiff.js:5:        DB.userInventory.get(msg.author.id),
 - ./DB_Interactions.md:132: - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/vdiff.js:8:    const vanillaUserData = (await vDB.users.findOne({ id: msg.author.id }).noCache())._doc;
 - ./DB_Interactions.md:133: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:12:  let BGBASE = await DB.cosmetics.bgs();
 - ./DB_Interactions.md:134: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:56:    DB.users.get(msg.author.id),
 - ./DB_Interactions.md:135: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:57:    DB.userInventory.get(msg.author.id),
 - ./DB_Interactions.md:136: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/craft.js:35:    const userDiscoveries = (await DB.userInventory.get(msg.author.id))?.inventory?.filter((itm) => itm.crafted).map((itm) => itm.id) || [];
 - ./DB_Interactions.md:137: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/favcolor.js:14:    const uData = await DB.users.get(usery.id);
 - ./DB_Interactions.md:138: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:22:    DB.users.get({ id: msg.author.id }),
 - ./DB_Interactions.md:139: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:23:    DB.userInventory.getFull(msg.author.id),
 - ./DB_Interactions.md:140: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:29:    BASE = await DB.cosmetics.find({ type: "background", code: { $in: cosmeticsDoc?.bgInventory || [] } });
 - ./DB_Interactions.md:141: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:34:    BASE = await DB.cosmetics.find({ type: "medal", icon: { $in: cosmeticsDoc?.medalInventory || [] } });
 - ./DB_Interactions.md:142: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:39:    BASE = await DB.cosmetics.find({ type: "sticker", id: { $in: cosmeticsDoc?.stickerInventory || [] } });
 - ./DB_Interactions.md:143: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:73:  const COSMETICSDATA = await DB.userInventory.get(msg.author.id);
 - ./DB_Interactions.md:144: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:90:  const boxparams = await DB.items.findOne({ id: args?.boxID || "lootbox_C_O" });
 - ./DB_Interactions.md:145: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/medalinfo.js:7:  const mdi = await DB.cosmetics.find({ type: "medal" });
 - ./DB_Interactions.md:146: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:7:    DB.users.getFull({ id: msg.author.id }),
 - ./DB_Interactions.md:147: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:8:    DB.cosmetics.find({ type: "sticker" }),
 - ./DB_Interactions.md:148: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:9:    DB.items.find({ type: "boosterpack" }),
 - ./DB_Interactions.md:149: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:10:    DB.userInventory.getFull(msg.author.id),
 - ./DB_Interactions.md:150: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/any.js:4:    let BASE = await DB.cosmetics.find({
 - ./DB_Interactions.md:151: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/index.js:20:  const userData = await DB.users.getFull({ id: message.author.id });
 - ./DB_Interactions.md:152: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthBg.js:5:  const cosmeticsData = await DB.userInventory.get(userData.id);
 - ./DB_Interactions.md:153: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthMedal.js:5:  const cosmeticsData = await DB.userInventory.get(userData.id);
 - ./DB_Interactions.md:154: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/balance.js:25:    DB.userInventory.get(Target.id),
 - ./DB_Interactions.md:155: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/balance.js:77:    lastTrans = await DB.audits.find({ $or: [{ from: TARGETDATA.id }, { to: TARGETDATA.id }] }).sort({ timestamp: -1 }).limit(5);
 - ./DB_Interactions.md:156: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:54:    DB.users.getFull(msg.author.id),
 - ./DB_Interactions.md:157: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:247:        const BOOSTERS = await DB.items.find({ type: "boosterpack", rarity: { $in: ["C", "U", "R"] } });
 - ./DB_Interactions.md:158: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:292:    // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:159: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:297:    // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:160: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:303:      // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:161: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/daily.js:312:      // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:162: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/givebox.js:19:  const [USERDATA] = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:163: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/givebox.js:48:      DB.users.getFull({ id: msg.author.id }),
 - ./DB_Interactions.md:164: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/givebox.js:49:      DB.users.getFull({ id: Target.id }),
 - ./DB_Interactions.md:165: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/givebox.js:50:      DB.items.find({ type: "box" }),
 - ./DB_Interactions.md:166: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/list.js:74:      (await DB.marketbase({ fullbase: 1 })).fullbase,
 - ./DB_Interactions.md:167: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/list.js:75:      DB.marketplace.find(query).countDocuments(),
 - ./DB_Interactions.md:168: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/list.js:84:    const pagecontent = await DB.marketplace.find(query).limit(12).skip(12 * ((page || 1) - 1)).lean();
 - ./DB_Interactions.md:169: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/post.js:44:      DB.users.getFull({ id: msg.author.id }),
 - ./DB_Interactions.md:170: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/post.js:45:      DB.userInventory.getFull(msg.author.id),
 - ./DB_Interactions.md:171: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/post.js:120:    const validItem = await DB.items.findOne(itemFindQuery);
 - ./DB_Interactions.md:172: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/post.js:121:    const checkCosmetic = await DB.cosmetics.findOne({
 - ./DB_Interactions.md:173: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/transfer.js:18:    DB.users.get(msg.author.id),
 - ./DB_Interactions.md:174: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/transfer.js:19:    DB.users.get(TARGET.id),
 - ./DB_Interactions.md:175: - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:59:  const serverResps = DB.responses.findOne({ server: msg.guild.id }).noCache();
 - ./DB_Interactions.md:176: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/airline/new.js:6:const STARTER_AIRPORTS_OPTIONS = DB.airlines.AIRPORT.find({ starter: true });
 - ./DB_Interactions.md:177: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/airline/new.js:7:const STARTER_AIRPLANE_OPTIONS = DB.airlines.AIRPLANES.find({ starter: true });
 - ./DB_Interactions.md:178: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/airline/new.js:40:  const existent = await DB.airlines.AIRLINES.findOne({ id: airlineID });
 - ./DB_Interactions.md:179: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/airline/routes/new.js:38:    const port = await DB.airlines.AIRPORT.findOne({ IATA: airlineId });
 - ./DB_Interactions.md:180: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/betflip.js:10:  const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:181: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:259:    DB.users.get(msg.author.id),
 - ./DB_Interactions.md:182: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:260:    DB.userInventory.get(msg.author.id),
 - ./DB_Interactions.md:183: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:272:  const DECKDATA = await DB.cosmetics.find({ type: "skin", for: "casino" });
 - ./DB_Interactions.md:184: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:581:  const USERDATA = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:185: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/highscores/flags.js:4:    const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? "guessflag-server" : "", args[0] == "solo" || !args[0] ? "guessflag-solo" : ""] } }).sort({ points: -1 }).limit(10);
 - ./DB_Interactions.md:186: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/highscores/_generic.js:4:  const RANKS = await DB.rankings
 - ./DB_Interactions.md:187: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/highscores.js:21:  const RANKS = await DB.rankings.find({ type: { $in: [args[0] == "server" || !args[0] ? "guessflag-server" : "", args[0] == "solo" || !args[0] ? "guessflag-solo" : ""] } }).sort({ points: -1 }).limit(10);
 - ./DB_Interactions.md:188: - z:/POLLUX/POLARIS/DEV/bot/core/commands/img/kiss.js:49:  const userData = Target ? await DB.users.findOne({ id: msg.author.id }).lean() : null;
 - ./DB_Interactions.md:189: - z:/POLLUX/POLARIS/DEV/bot/core/commands/img/kiss.js:50:  const marriedtarget = await DB.relationships.find({ users: msg.author.id });
 - ./DB_Interactions.md:190: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:5:    const userData_OLD = await vDB.users.findOne({ id: msg.author.id }).noCache().lean();
 - ./DB_Interactions.md:191: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:6:    const userData_NEW = await DB.users.findOne({ id: msg.author.id }).noCache();
 - ./DB_Interactions.md:192: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:16:        // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:193: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:33:        // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:194: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:39:  const userData_OLD = await vDB.users.findOne({ id: msg.author.id }).noCache().lean();
 - ./DB_Interactions.md:195: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:40:  const userData_NEW = await DB.users.findOne({ id: msg.author.id }).noCache().lean();
 - ./DB_Interactions.md:196: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:166:          // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:197: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:168:          // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:198: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:275:          const myBGsFULL = await DB.cosmetics.find({ code: { $in: myBGs } }).lean();
 - ./DB_Interactions.md:199: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:327:              // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:200: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:403:      let neodata = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:201: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:3:  const USERDATA = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:202: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:37:    const SVdata = await DB.servers.findOne({ id: primeServerId }).lean();
 - ./DB_Interactions.md:203: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/status.js:71:		description: `Patch [\`v${ver}\`](https://ptb.discord.com/channels/277391723322408960/712055672799232092 "See patch notes • ${commit}") | Database \`${DB.version}\` | Engine \`Eris v${PLX.engine.VERSION}\``,
 - ./DB_Interactions.md:204: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/transactionlookup.js:7:  const log = await DB.audits.get({ transactionId: filterid });
 - ./DB_Interactions.md:205: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/transactionlookup.js:25:    ? (await DB.users.get({ id: log.to }))?.meta
 - ./DB_Interactions.md:206: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/transactionlookup.js:26:    : (await DB.users.getFull({ id: log.from }))?.meta;
 - ./DB_Interactions.md:207: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/transactionlookup.js:49:    const ouser = (await DB.users.findOne({ id: log.to }))?.meta || log.to;
 - ./DB_Interactions.md:208: - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/decks.js:8:      DB.cosmetics.find({ type: "skin", for: "casino" }),
 - ./DB_Interactions.md:209: - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/decks.js:9:      DB.userInventory.get(msg.author.id),
 - ./DB_Interactions.md:210: - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/inventory.js:49:    DB.users.get(Target.id, {
 - ./DB_Interactions.md:211: - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/inventory.js:53:    DB.items.find().lean().exec(),
 - ./DB_Interactions.md:212: - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/inventory.js:54:    DB.userInventory.get(Target.id),
 - ./DB_Interactions.md:213: - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/use.js:5:    DB.users.getFull(msg.author.id),
 - ./DB_Interactions.md:214: - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/use.js:6:    DB.userInventory.getFull(msg.author.id),
 - ./DB_Interactions.md:215: - z:/POLLUX/POLARIS/DEV/bot/core/commands/inventory/use.js:17:      const itemDetails = DB.items.get(ITEM);
 - ./DB_Interactions.md:216: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:6:  const USERDATA = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:217: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:23:  const SVdata = (await DB.servers.findOne({ id: msg.args[0] }).lean()) || await vDB.servers.findOne({ id: msg.args[0] }).lean();
 - ./DB_Interactions.md:218: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/claimtokens.js:5:    const oldUser = await vDB.users.findOne({ id: msg.author.id });
 - ./DB_Interactions.md:219: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/errandfix.js:4:    const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:220: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/errandfix.js:5:    const errandsData = await DB.quests.find({ id: { $in: userData.quests?.map(e => e.id) } }).noCache().lean();
 - ./DB_Interactions.md:221: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/inventmigrate.js:3:  const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:222: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/inventmigrate.js:5:  // TODO(sunset): migrate to DB.userInventory
 - ./DB_Interactions.md:223: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:5:	const USERDATA = await vDB.users.get(msg.author.id);
 - ./DB_Interactions.md:224: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:6:	const newUserData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:225: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:11:		const rships = await DB.relationships.find({users: msg.author.id});
 - ./DB_Interactions.md:226: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:29:		newmar.preexistent = await DB.relationships.findOne({ users: { $all: [msg.author.id, mar.id] } });
 - ./DB_Interactions.md:227: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:161:			const newM = DB.relationships.create("marriage", thisMrg.users, thisMrg.initiative, thisMrg.ring, thisMrg.since);
 - ./DB_Interactions.md:228: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/ban.js:14:  const serverData = await DB.servers.get(msg.guild.id);
 - ./DB_Interactions.md:229: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/clear.js:6:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./DB_Interactions.md:230: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/kick.js:8:  const serverData = await DB.servers.get(msg.guild.id);
 - ./DB_Interactions.md:231: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/lang.js:24:  const serverData = await DB.servers.get(msg.guild.id);
 - ./DB_Interactions.md:232: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:17:  let ServerDATA = await DB.servers.get(Server.id);
 - ./DB_Interactions.md:233: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:20:    await DB.servers.get(Server.id);
 - ./DB_Interactions.md:234: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:214:    DB.mutes.add({ S: Mem.guild.id, U: Mem.id, E: freedom });
 - ./DB_Interactions.md:235: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/paidroles.js:15:  const serverData = await DB.servers.get(msg.guild.id, { "modules.MODROLE": 1 });
 - ./DB_Interactions.md:236: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/paidroles.js:20:  const roleMarket = await DB.paidroles.find({ server: msg.guild.id }).lean();
 - ./DB_Interactions.md:237: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/purge.js:8:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./DB_Interactions.md:238: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:13:  const serverData = await DB.servers.get(msg.guild.id, { "modules.MODROLE": 1 });
 - ./DB_Interactions.md:239: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:75:  const ReactionData = await DB.reactRoles.find({ server: msg.guild.id });
 - ./DB_Interactions.md:240: - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/adventure.js:123:  const LOCATIONS_B = await DB.advLocations.traceRoutes("LSGC", durationChoice);
 - ./DB_Interactions.md:241: - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/adventure.js:154:  //const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:242: - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/adventure.js:158:  const playersHere = await DB.advJourneys.find({ location: selectedLocation._id, end: { $gt: Date.now() } }).lean();
 - ./DB_Interactions.md:243: - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/errands/forfeit.js:8:    const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:244: - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/errands/forfeit.js:16:        let errandsData = await DB.quests.find({ id: { $in: notCompleted.map(e => e.id) } }).noCache().lean();
 - ./DB_Interactions.md:245: - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/errands/index.js:43:    let errandsData = await DB.quests.find({ id: { $in: userErrands.map(e => e.id) } }).noCache().lean();
 - ./DB_Interactions.md:246: - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:18:  let USERDATA = await DB.users.getFull({ id: message.author.id });
 - ./DB_Interactions.md:247: - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:51:  USERDATA = await DB.users.getFull({ id: message.author.id });
 - ./DB_Interactions.md:248: - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/roll.js:28:  const userDATA = await DB.users.get({ id: message.author.id });
 - ./DB_Interactions.md:249: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/buyrole.js:4:  const roleMarket = await DB.paidroles.find({ server: msg.guild.id }).lean();
 - ./DB_Interactions.md:250: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/buyrole.js:15:  const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:251: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/buyrole.js:27:    DB.temproles.add({
 - ./DB_Interactions.md:252: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:14:    DB.users.findOne({ id: msg.author.id }),
 - ./DB_Interactions.md:253: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:15:    DB.userInventory.getFull(msg.author.id),
 - ./DB_Interactions.md:254: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:17:  const targetData = (await DB.commends.parseFull({ id: Target.id })) || {
 - ./DB_Interactions.md:255: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:68:      DB.commends.add(userData.id, Target.id, 1),
 - ./DB_Interactions.md:256: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:130:  const targetData = (await DB.commends.parseFull({ id: Target.id })) || {
 - ./DB_Interactions.md:257: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/commend.js:136:  const metas = await DB.users
 - ./DB_Interactions.md:258: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:4:  const marriages = await DB.relationships.find({
 - ./DB_Interactions.md:259: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:31:          label: (await DB.users.getFull(uID)).tag,
 - ./DB_Interactions.md:260: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:91:  const user = await DB.users.getFull(msg.author.id);
 - ./DB_Interactions.md:261: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:92:  const partner = await DB.users.getFull(toDivorceUserId);
 - ./DB_Interactions.md:262: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:164:  await DB.relationships.findByIdAndDelete(marriage._id);
 - ./DB_Interactions.md:263: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/divorce.js:232:  await DB.relationships.findByIdAndDelete(marriage._id);
 - ./DB_Interactions.md:264: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/give.js:2:  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - ./DB_Interactions.md:265: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/inventory.js:2:  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - ./DB_Interactions.md:266: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:4:  const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - ./DB_Interactions.md:267: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:8:  const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:268: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:12:  const dbItemData = await DB.cosmetics.get({[giftMetadata.finder]:gift.item});
 - ./DB_Interactions.md:269: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/peek.js:5:    const inventory = await DB.gifts.find({ holder: msg.author.id }).lean();
 - ./DB_Interactions.md:270: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/peek.js:8:    const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:271: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/wrap.js:26:  const userData = await DB.users.getFull({ id: msg.author.id });
 - ./DB_Interactions.md:272: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:8:  return DB.users.find({}, PROJECTION).sort({ "progression.exp": -1 })
 - ./DB_Interactions.md:273: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:13:  const lRanks = await DB.localranks.find({ server }).sort({ exp: -1 })
 - ./DB_Interactions.md:274: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:15:  const dbRankData = await DB.users.find({ id: { $in: lRanks.map((u) => u.user) } }, PROJECTION).lean();
 - ./DB_Interactions.md:275: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:38:    // DB.servers.get(Server.id),
 - ./DB_Interactions.md:276: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:40:    DB.users.get(msg.author.id),
 - ./DB_Interactions.md:277: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:41:    DB.localranks.get({ server: msg.guild.id, user: msg.author.id }),
 - ./DB_Interactions.md:278: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:46:      ? await DB.localranks.find({ server: msg.guild.id, exp: { $gt: selfLocal.exp } }, { _id: 1 }).count()
 - ./DB_Interactions.md:279: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/leaderboards.js:47:      : await DB.users.find({ "progression.exp": { $gt: userData.progression.exp } }, { _id: 1 }).count());
 - ./DB_Interactions.md:280: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:6:const userDB = DB.users;
 - ./DB_Interactions.md:281: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:7:const serverDB = DB.servers;
 - ./DB_Interactions.md:282: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:48:  const TARGET_DB = await userDB.findOne({ id: Target.id });
 - ./DB_Interactions.md:283: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:49:  const SV_DB = await serverDB.findOne({ id: Server.id });
 - ./DB_Interactions.md:284: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:51:  const favcolor = TARGET_DB.profile.favcolor || "#eb11da";
 - ./DB_Interactions.md:285: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:58:  const exp = TARGET_DB.progression.exp || 0;
 - ./DB_Interactions.md:286: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:59:  const level = TARGET_DB.progression.level || 0;
 - ./DB_Interactions.md:287: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:73:    l_exp = (await DB.localranks.get({ user: Target.id, server: msg.guild.id })).exp || 0;
 - ./DB_Interactions.md:288: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/level.js:74:    l_level = (await DB.localranks.get({ user: Target.id, server: msg.guild.id })).level || 0;
 - ./DB_Interactions.md:289: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:24:	const userMarriages = await DB.relationships.find({ type: "marriage", users: msg.author.id });
 - ./DB_Interactions.md:290: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:39:		DB.users.getFull(msg.author.id),
 - ./DB_Interactions.md:291: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:40:		DB.userInventory.get(msg.author.id),
 - ./DB_Interactions.md:292: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:44:	const userInventoryFull = await DB.items.find( {series:"ring", id: { $in: inventoryIDmap}} ).lean();
 - ./DB_Interactions.md:293: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:155:		const marriages = await DB.relationships.find({ type: "marriage", users: msg.author.id });
 - ./DB_Interactions.md:294: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:210:		const THIS_MARRIAGE_ID = (await DB.relationships.create("marriage", [msg.author.id, Target.id], msg.author.id, selectedRing.id))._id;
 - ./DB_Interactions.md:295: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:331:	const userMarriages = await DB.relationships.find({users: user });
 - ./DB_Interactions.md:296: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:348:							DB.items.findOne({ id: mrg.ring }).lean().exec()
 - ./DB_Interactions.md:297: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:410:		DB.users.getFull(msg.author.id),
 - ./DB_Interactions.md:298: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:411:		DB.userInventory.get(msg.author.id),
 - ./DB_Interactions.md:299: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:415:	const userInventoryFull = await DB.items.find( {series:"ring", id: { $in: inventoryIDmap}} ).lean();
 - ./DB_Interactions.md:300: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:458:				selectedRing = await DB.items.findOne({id: val});
 - ./DB_Interactions.md:301: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:462:				selectedRel = await DB.relationships.findOne({_id: val.toString()});
 - ./DB_Interactions.md:302: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:480:	const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:303: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:507:				selectedRing = await DB.items.findOne({id: val});
 - ./DB_Interactions.md:304: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:514:				selectedRel = await DB.relationships.findOne({_id: val});
 - ./DB_Interactions.md:305: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:515:				selectedRing = await DB.items.findOne({id: selectedRel.ring});
 - ./DB_Interactions.md:306: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:522:				const ringsCol = await DB.items.find({id:{$in: selectedRel.ringCollection }});
 - ./DB_Interactions.md:307: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/personaltext.js:7:  const userData = await DB.users.findOne({ id: msg.author.id });
 - ./DB_Interactions.md:308: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile-v1.js:138:    const dDATA = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:309: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile-v1.js:170:  let Target_Database = await DB.users.get({ id: Target.id });
 - ./DB_Interactions.md:310: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profilelink.js:6:  const userdata = await DB.users.getFull({ id: TARGET.id });
 - ./DB_Interactions.md:311: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/rank.js:11:    userData = await DB.users.get(TARGET.id),
 - ./DB_Interactions.md:312: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/rank.js:12:    serverData = await DB.servers.get(msg.guild.id),
 - ./DB_Interactions.md:313: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/rank.js:13:    selfLocal = await DB.localranks.get({ user: TARGET.id, server: msg.guild.id }),
 - ./DB_Interactions.md:314: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/rank.js:72:  LRpos = await DB.localranks.find({ server: msg.guild.id, exp: { $gt: selfLocal.exp } }, { _id: 1 }).countDocuments();
 - ./DB_Interactions.md:315: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/roleme.js:2:	const GUILD = await DB.servers.findOne({ id: msg.guild.id });
 - ./DB_Interactions.md:316: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/tagline.js:7:  const userData = await DB.users.findOne({ id: msg.author.id });
 - ./DB_Interactions.md:317: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/thanks.js:17:    const TargetServerData = await DB.localranks.findOne({ user: Target.id, server: msg.guild.id }).noCache()
 - ./DB_Interactions.md:318: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/thanks.js:80:        const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./DB_Interactions.md:319: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:17:  const userData = await DB.users.get(m.author.id);
 - ./DB_Interactions.md:320: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:20:  const myCommends = await DB.commends.parseFull(m.author.id);
 - ./DB_Interactions.md:321: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:23:      DB.commends.aggregate([{ $group: { _id: "$from", total: { $sum: "$count" } } }, { $sort: { total: -1 } }, { $limit: 10 }]),
 - ./DB_Interactions.md:322: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:24:      DB.commends.aggregate([{ $group: { _id: "$to", total: { $sum: "$count" } } }, { $sort: { total: -1 } }, { $limit: 10 }]),
 - ./DB_Interactions.md:323: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:25:      ((await DB.commends.aggregate([{ $group: { _id: "$to", total: { $sum: "$count" } } }, { $match: { total: { $gt: myCommends.totalIn } } }, { $count: "COUNT" }]))[0]?.COUNT || 0) + 1,
 - ./DB_Interactions.md:324: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:26:      ((await DB.commends.aggregate([{ $group: { _id: "$from", total: { $sum: "$count" } } }, { $match: { total: { $gt: myCommends.totalOut } } }, { $count: "COUNT" }]))[0]?.COUNT || 0) + 1,
 - ./DB_Interactions.md:325: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/top.js:98:  const rank = await DB.localranks.find({ server: msg.guild.id, thx: { $gt: 0 } }).sort({ thx: -1 }).limit(10).lean();
 - ./DB_Interactions.md:326: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/chdeck.js:17:    const userChannelDeck = (await DB.users.get(msg.author.id)).switches?.channeldeck || [];
 - ./DB_Interactions.md:327: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/pin.js:6:  const serverData = await DB.servers.get(msg.guild.id);
 - ./DB_Interactions.md:328: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/reminder.js:21:  const userReminders = await DB.feed.find({ url: msg.author.id }).lean();
 - ./DB_Interactions.md:329: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:11:	const feedData = await DB.feed.find({ server: msg.guild.id, type: "rss" }).lean()
 - ./DB_Interactions.md:330: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:39:		await DB.feed["new"](payload);
 - ./DB_Interactions.md:331: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/say.js:10:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./DB_Interactions.md:332: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/saytochannel.js:6:  const ServerDATA = await DB.servers.get(msg.guild.id);
 - ./DB_Interactions.md:333: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:7:  const tagObj = await DB.responses.findOne({server:msg.guild.id,tag});
 - ./DB_Interactions.md:334: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:63:  const serverResps = await DB.responses.findOne({ server:msg.guild.id, tag }).noCache();
 - ./DB_Interactions.md:335: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:81:  const preexistingItem = await DB.responses.findOne({ server:msg.guild.id, tag }).noCache();
 - ./DB_Interactions.md:336: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/twitchalert.js:32:    const feedData = await DB.feed.find({ server: msg.guild.id, type: "twitch" });
 - ./DB_Interactions.md:337: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/weather.js:36:		args[0] = (await DB.users.get(msg.author.id, { personal: 1 })).personal?.city;
 - ./DB_Interactions.md:338: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:18:  const feedData = await DB.feed.find({ server: msg.guild.id, type: "youtube" });
 - ./DB_Interactions.md:339: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/primerollout.js:10:    const thisSticker = await DB.cosmetics.findOne({ id: composeStickerName() }).noCache();
 - ./DB_Interactions.md:340: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/eval.js:9:    .replace(DB.native.host, "[REDACTED]")
 - ./DB_Interactions.md:341: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/eval.js:10:    .replace(DB.native.name, "[REDACTED]")
 - ./DB_Interactions.md:342: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/eval.js:11:    .replace(DB.native.port, "[REDACTED]")
 - ./DB_Interactions.md:343: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/eval.js:12:    .replace(DB.native.pass, "[REDACTED]")
 - ./DB_Interactions.md:344: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/fanartApprove.js:6:    let Fanart = await DB.fanart.findOne({ hash });
 - ./DB_Interactions.md:345: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/lvup.js:36:    const userData = await DB.users.get(msg.author.id);
 - ./DB_Interactions.md:346: - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:125:        await DB.users.findOne({ "prime.servers": m.guild.id }).cache()
 - ./DB_Interactions.md:347: - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:175:    const knownError = await DB.globals.findOne({code: errorCode, type: "errorCode", known: true });
 - ./DB_Interactions.md:348: - z:/POLLUX/POLARIS/DEV/bot/core/structures/Premium.js:8:      DB.users.get(user.id).then((usr) => {
 - ./DB_Interactions.md:349: - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:24:    const USERDATA = await DB.users.get({ id: user.id }, undefined, "users");
 - ./DB_Interactions.md:350: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:13: *  2. This is the ONLY file allowed to reference DB._legacyUserDB.
 - ./DB_Interactions.md:351: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:16: *     DB._legacyUserDB / DB.userDB exports from database_schema.
 - ./DB_Interactions.md:352: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:55: * @deprecated Use DB.users.get() directly when all users are migrated.
 - ./DB_Interactions.md:353: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:65:  const user = await DB.users.get(userId, projection);
 - ./DB_Interactions.md:354: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:71:    legacyUser = await DB._legacyUserDB.findOne({ id: userId }).lean();
 - ./DB_Interactions.md:355: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:96: * @deprecated Use DB.users.getFull() directly when all users are migrated.
 - ./DB_Interactions.md:356: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:104:  const user = await DB.users.getFull(userId);
 - ./DB_Interactions.md:357: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:114:    legacyUser = await DB._legacyUserDB.findOne({ id: userId }).lean();
 - ./DB_Interactions.md:358: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:132:  return DB.users.getFull(userId);
 - ./DB_Interactions.md:359: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:138: * @deprecated Use DB.userInventory.get() directly when all users are migrated.
 - ./DB_Interactions.md:360: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:146:  const cosmetics = await DB.userInventory.get(userId);
 - ./DB_Interactions.md:361: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:152:    legacyUser = await DB._legacyUserDB.findOne(
 - ./DB_Interactions.md:362: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:190: * @deprecated Use DB.userInventory.getFull() directly when all users are migrated.
 - ./DB_Interactions.md:363: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:198:  let doc = await DB.userInventory.getFull(userId);
 - ./DB_Interactions.md:364: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:214:  return DB.userInventory.getFull(userId);
 - ./DB_Interactions.md:365: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:220: * @deprecated Use DB.userOAuth.get() directly when all users are migrated.
 - ./DB_Interactions.md:366: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:228:  const oauth = await DB.userOAuth.get(userId);
 - ./DB_Interactions.md:367: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:233:    legacyUser = await DB._legacyUserDB.findOne(
 - ./DB_Interactions.md:368: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:79:  const inFlight = DB.servers.findOne({ id: guildId }).lean().exec()
 - ./DB_Interactions.md:369: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:335:      await DB.users.getFull({ id: luckyOne.id }).then((userdata) => userdata.addItem(BOX.id));
 - ./DB_Interactions.md:370: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/customResponses.js:15:	const gResps = await DB.responses.find({ server: msg.guild.id }).noCache() || [];
 - ./DB_Interactions.md:371: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/index.js:18:  DB.feed.find({ server: {$in: allGuilds } }).lean().then(async (/** @type {Feed[]} */serverFeeds) => {
 - ./DB_Interactions.md:372: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/index.js:20:    const servers = await DB.servers.find({ id: { $in: serverFeeds.map((f) => f.server) } }, { "modules.LANGUAGE": 1, id: 1 }).lean();
 - ./DB_Interactions.md:373: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/globalLevelUp.js:41:	userData ??= await DB.users.getFull(msg.author.id);
 - ./DB_Interactions.md:374: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:3:const getLocalRank = (GID,UID) => DB.localranks.findOne({ user: UID, server: GID }).noCache();
 - ./DB_Interactions.md:375: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:29:	DB.localranks.incrementExp({ U: userID, S: serverID });
 - ./DB_Interactions.md:376: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/microtasks/serverCache.js:13:    return DB.servers.find(query).lean().exec().then((servers) => {
 - ./DB_Interactions.md:377: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/microtasks/serverCache.js:44:    return DB.channels.find(query).lean().exec().then((channels) => {
 - ./DB_Interactions.md:378: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryMessage.js:26:    msg.guild.serverData = await DB.servers.findOne({ id: msg.guild.id }).cache();
 - ./DB_Interactions.md:379: - z:/POLLUX/POLARIS/DEV/bot/core/utilities/Gearbox/client.js:14:        if (enforceDB && !(await DB.users.get(ID))) return Promise.reject("USER NOT IN DB");
 - ./DB_Interactions.md:380: - z:/POLLUX/POLARIS/DEV/bot/core/utilities/Gearbox/client.js:37:        if (enforceDB && !(await DB.users.get(ID))) return Promise.reject( new Error("USER NOT IN DB") );
 - ./DB_Interactions.md:381: - z:/POLLUX/POLARIS/DEV/bot/core/utilities/Premium.js:21:      DB.users.get(user.id).then((usr) => {
 - ./DB_Interactions.md:382: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:5:> **Note:** at the time of writing the bot accesses the database indirectly via the `DB`/`vDB` connection objects returned by `@polestarlabs/database_schema`.  Most read/write operations live in helper modules, subroutines, or command files (see `core/`) and are performed through shared packages under `node_modules`.  The only **direct** `DB.` call inside this repository is the blacklist fallback in `pollux.js`; every other interaction occurs in the modules listed below.  For migration, each of these must be replaced by the appropriate dashboard API endpoint.
 - ./DB_Interactions.md:383: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:24:| `core/commands/infra/*` | users, vDB.users, servers, audits, etc. | both | R/W | ❓ (migration utilities likely no) | ✅ yes |
 - ./DB_Interactions.md:384: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:40:core/archetypes/Premium.js: ... DB.users.set ...
 - ./DB_Interactions.md:385: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:43:core/archetypes/Switch.js: ... DB.servers.get ... DB.channels.get/new ... DB.servers.set ... DB.channels.set ...
 - ./DB_Interactions.md:386: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:44:core/archetypes/UserProfileModel.js: ... DB.users ... DB.localranks.get ... DB.relationships.findOne ...
 - ./DB_Interactions.md:387: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:45:core/archetypes/Venture.js: ... DB.advLocations.findOne/traceRoutes/find ... DB.advJourneys.countDocuments ...
 - ./DB_Interactions.md:388: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:46:core/commands/beta/debug.js: DB.users.set/findOne ...
 - ./DB_Interactions.md:389: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:47:core/commands/beta/vdiff.js: DB.users.findOne/noCache ... DB.userInventory.get ...
 - ./DB_Interactions.md:390: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:51:core/commands/img/kiss.js: DB.users.findOne ... DB.relationships.find ... DB.relationships.set ...
 - ./DB_Interactions.md:391: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:55:-sidecar.js cron jobs: DB.temproles, DB.mutes, DB.feed
 - ./DB_Interactions.md:392: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:68:4. **Bot modifications:** each `DB.*` call in the bot code will be replaced by an HTTP client request (e.g. `PLX.api.get(…)` or `PLX.api.post(…)`) matching the new endpoint names. A wrapper library may abstract the translation.
 - ./DB_Interactions.md:393: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildCreate.js:4:    await DB.servers.get(guild.id).then(async sv=>{
 - ./DB_Interactions.md:394: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildMemberAdd.js:2:  Promise.all([DB.servers.findOne({id:guild.id}).cache(), DB.users.findOne({id:member.id}).cache()]).then(([svData, userData]) => {
 - ./DB_Interactions.md:395: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildMemberRemove.js:2:  Promise.all([DB.servers.findOne({id:guild.id}).cache(), DB.users.findOne({id:member.id}).cache()]).then(([svData, userData]) => {
 - ./DB_Interactions.md:396: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/interactions/langsel.js:11:    const serverData = await DB.servers.get(interaction.guild.id, { "modules.MODROLE": 1 });
 - ./DB_Interactions.md:397: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/messageReactionAdd.js:5:  DB.reactRoles.findOne({ channel: msg.channel.id, message: msg.id }).then((RCT) => {
 - ./DB_Interactions.md:398: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/messageReactionRemove.js:4:  DB.reactRoles.findOne({ message: msg.id, channel: msg.channel.id }).then((RCT) => {
 - ./DB_Interactions.md:399: - z:/POLLUX/POLARIS/DEV/bot/ISSUES_AUDIT.md:59:- [ ] TODO: add emojis and save adventure to DB. See [core/commands/pollux/adventure.js](core/commands/pollux/adventure.js).
 - ./DB_Interactions.md:400: - z:/POLLUX/POLARIS/DEV/bot/pollux.js:192:      DB.users
 - ./DB_Interactions.md:401: - z:/POLLUX/POLARIS/DEV/bot/pollux.js:196:      DB.servers
 - ./DB_Interactions.md:402: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:89:        DB.servers.get(tprl.server).then(async (/* svData */) => {
 - ./DB_Interactions.md:403: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:135:        DB.servers.get(muteSv).then((svData) => {
 - ./DB_Interactions.md:404: - z:/POLLUX/POLARIS/DEV/bot/startup/auxiliarySideFunctions.js:7:        let udata = await DB.users.findOne({ id: user.id });
 - ./DB_Interactions.md:405: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:112:      DB.users.get.mockResolvedValueOnce(userData);
 - ./DB_Interactions.md:406: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:120:      DB.users.get.mockResolvedValueOnce(userData);
 - ./DB_Interactions.md:407: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:137:      DB.users.get.mockResolvedValueOnce(null);
 - ./DB_Interactions.md:408: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:152:      DB.users.get.mockResolvedValueOnce(userData);
 - ./DB_Interactions.md:409: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:165:      DB.users.get.mockResolvedValue(richUser);
 - ./DB_Interactions.md:410: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:182:      DB.users.get.mockResolvedValueOnce(brokeUser);
 - ./DB_Interactions.md:411: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:216:      DB.users.get.mockResolvedValue(user);
 - ./DB_Interactions.md:412: - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:17:    global.DB.servers.findOne = jest.fn(() => ({
 - ./DB_Interactions.md:413: - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:63:    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(1);
 - ./DB_Interactions.md:414: - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:69:    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(2);
 - ./DB_Interactions.md:415: - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:114:    global.DB.servers.findOne = jest.fn(() => ({
 - ./DB_Interactions.md:416: - z:/POLLUX/POLARIS/DEV/bot/test/subroutines/boxDrops.test.js:127:    global.DB.users = { set: jest.fn().mockResolvedValue(true), getFull: jest.fn().mockResolvedValue({ addItem: jest.fn() }) };
 - ./DB_Interactions.md:667:The script reruns the grep over the codebase and appends any new read/write lines under the respective sections. Run it whenever you add or modify `DB.` calls, and the file will naturally grow with every query.
 - ./eventHandlers/guildCreate.js:4:    await DB.servers.get(guild.id).then(async sv=>{
 - ./eventHandlers/guildMemberAdd.js:2:  Promise.all([DB.servers.findOne({id:guild.id}).cache(), DB.users.findOne({id:member.id}).cache()]).then(([svData, userData]) => {
 - ./eventHandlers/guildMemberRemove.js:2:  Promise.all([DB.servers.findOne({id:guild.id}).cache(), DB.users.findOne({id:member.id}).cache()]).then(([svData, userData]) => {
 - ./eventHandlers/interactions/langsel.js:11:    const serverData = await DB.servers.get(interaction.guild.id, { "modules.MODROLE": 1 });
 - ./eventHandlers/messageReactionAdd.js:5:  DB.reactRoles.findOne({ channel: msg.channel.id, message: msg.id }).then((RCT) => {
 - ./eventHandlers/messageReactionRemove.js:4:  DB.reactRoles.findOne({ message: msg.id, channel: msg.channel.id }).then((RCT) => {
 - ./ISSUES_AUDIT.md:59:- [ ] TODO: add emojis and save adventure to DB. See [core/commands/pollux/adventure.js](core/commands/pollux/adventure.js).
 - ./pollux.js:192:      DB.users
 - ./pollux.js:196:      DB.servers
 - ./sidecar.js:89:        DB.servers.get(tprl.server).then(async (/* svData */) => {
 - ./sidecar.js:135:        DB.servers.get(muteSv).then((svData) => {
 - ./startup/auxiliarySideFunctions.js:7:        let udata = await DB.users.findOne({ id: user.id });
 - ./test/archetypes/Economy.test.js:112:      DB.users.get.mockResolvedValueOnce(userData);
 - ./test/archetypes/Economy.test.js:120:      DB.users.get.mockResolvedValueOnce(userData);
 - ./test/archetypes/Economy.test.js:137:      DB.users.get.mockResolvedValueOnce(null);
 - ./test/archetypes/Economy.test.js:152:      DB.users.get.mockResolvedValueOnce(userData);
 - ./test/archetypes/Economy.test.js:165:      DB.users.get.mockResolvedValue(richUser);
 - ./test/archetypes/Economy.test.js:182:      DB.users.get.mockResolvedValueOnce(brokeUser);
 - ./test/archetypes/Economy.test.js:216:      DB.users.get.mockResolvedValue(user);
 - ./test/subroutines/boxDrops.test.js:17:    global.DB.servers.findOne = jest.fn(() => ({
 - ./test/subroutines/boxDrops.test.js:63:    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(1);
 - ./test/subroutines/boxDrops.test.js:69:    expect(global.DB.servers.findOne).toHaveBeenCalledTimes(2);
 - ./test/subroutines/boxDrops.test.js:114:    global.DB.servers.findOne = jest.fn(() => ({
 - ./test/subroutines/boxDrops.test.js:127:    global.DB.users = { set: jest.fn().mockResolvedValue(true), getFull: jest.fn().mockResolvedValue({ addItem: jest.fn() }) };
\n## Detailed write operations (updated Sat, Mar  7, 2026  3:14:09 PM)\n
 - ./core/archetypes/Achievements.js:18:    //  return DB.progression.set({achievement,user,type:'achievement'},{$set: {awarded:true} } );
 - ./core/archetypes/Achievements.js:30:      return DB.progression.set({achievement,user,type:'achievement'},{$inc: {tracker:value} } );
 - ./core/archetypes/Achievements.js:33:      //return DB.progression.set({achievement,user,type:'achievement'},{$set: {tracker:value} } );
 - ./core/archetypes/Achievements.js:141:    DB.users.set(uID, { $inc: { "progression.exp": awarded.exp || 100 } });
 - ./core/archetypes/Airline.js:16:        return DB.airlines.SLOTS.new((await (this.airline)).id, airportData.id, time);
 - ./core/archetypes/Airline.js:35:    return DB.airlines.AIRLINES.new(ownerID, airlineID, airlineName);
 - ./core/archetypes/Airline.js:39:    return DB.airlines.ROUTES.new(departure, destination, this.id, airplane, ticketPrice);
 - ./core/archetypes/Crafter.js:290:      DB.userInventory.bulkWrite(cosmeticsToWrite),
 - ./core/archetypes/Crafter.js:291:      DB.users.bulkWrite(toWrite),
 - ./core/archetypes/Crafter.js:299:      return DB.audits.collection.insertMany(payloads)
 - ./core/archetypes/Economy.js:390:  await DB.users.bulkWrite(toWrite);
 - ./core/archetypes/Economy.js:391:  await DB.audits.collection.insertMany(payloads);
 - ./core/archetypes/Economy.js:415:  await DB.audits.new({ ...fields, ...payload });
 - ./core/archetypes/Premium.js:477:    await DB.users.set(userID, { $set: { "counters.prime_streak": {} } });
 - ./core/archetypes/Premium.js:483:  if (!tierStreaks || !currentTierStreak)  await DB.users.set(userID, { $set: { [`counters.prime_streak.${currentTier}`]: 1 } });
 - ./core/archetypes/Premium.js:484:  else await DB.users.set(userID, { $inc: { [`counters.prime_streak.${currentTier}`]: 1 } });
 - ./core/archetypes/Premium.js:486:  if (!totalStreak) await DB.users.set(userID, { $set: { "counters.prime_streak.total": 1 } });
 - ./core/archetypes/Premium.js:487:  else await DB.users.set(userID, { $inc: { "counters.prime_streak.total": 1 } });
 - ./core/archetypes/Premium.js:648:    //await DB.users.set(userID, { "modules.EVT": 0 }).catch((err) => { console.error(err); return null; });
 - ./core/archetypes/Premium.js:654:    ? await DB.userInventory.bulkWrite(bulkWriteQuery).catch((err) => { console.error(err); return null; })
 - ./core/archetypes/Premium.js:656:  const q2 = await DB.users.set(userID, regularQuery).catch((err) => { console.error(err); return null; });
 - ./core/archetypes/Premium.js:658:    ? await DB.userInventory.set(userID, cosmeticsQuery).catch((err) => { console.error(err); return null; })
 - ./core/archetypes/Progression.js:102:                await DB.users.set(userID, {
 - ./core/archetypes/Progression.js:136:        await DB.users.updateOne({ id: userID, "quests._id": questUniqueID }, { $inc: { 'quests.$.progress': value } }, { new: !0 });
 - ./core/archetypes/Progression.js:141:        await DB.users.updateOne({ id: userID, "quests._id": questUniqueID }, { $set: { 'quests.$.progress': value } }, { new: !0 });
 - ./core/archetypes/Progression.js:146:        await DB.users.set(userID, { $set: { quests } });
 - ./core/archetypes/Progression.js:168:                    await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - ./core/archetypes/Progression.js:172:                    await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - ./core/archetypes/Progression.js:191:            await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - ./core/archetypes/Progression.js:195:            await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - ./core/archetypes/Progression.js:210:        await DB.users.set(userID, { $push: { quests: newQuest } });
 - ./core/archetypes/Progression.js:217:        await DB.users.set(userID, { $pull: { "quests": { id: questID } } });
 - ./core/archetypes/Progression.js:222:        await DB.users.set(userID, { $push: { quests: newQuest } });
 - ./core/archetypes/Progression.js:309:    await DB.users.set(userID, {
 - ./core/archetypes/Redeem.js:16:    return DB.promocodes.updateOne({ code: this.code}, {locked: true});
 - ./core/archetypes/Redeem.js:19:    return DB.promocodes.updateOne({ code: this.code}, {locked: false});
 - ./core/archetypes/Redeem.js:45:    let res = await DB.promocodes.updateOne({ code: this.code }, query);
 - ./core/archetypes/Redeem.js:162:        await DB.promocodes.updateOne({ code }, {
 - ./core/archetypes/Redeem.js:186:      await DB.users.set(this.user, {$addToSet: {[`modules.${sPrize.inventory}`]: prizeItem.code||prizeItem.icon||prizeItem.id } } );
 - ./core/archetypes/Redeem.js:196:    return DB.audits.new({
 - ./core/archetypes/Switch.js:146:      if (!guildobj) guildobj = DB.guilds.new(this._guild); // FIXME Both of these return void?
 - ./core/archetypes/Switch.js:147:      if (!channelobj) channelobj = DB.channels.new(this._channel);
 - ./core/archetypes/Switch.js:177:      DB.servers.set(this._guild.id, { $set: { "modules.DISABLED": this.gd } }),
 - ./core/archetypes/Switch.js:178:      DB.channels.set(this._channel.id, { $set: { "modules.DISABLED": this.cd, "modules.ENABLED": this.ce } }),
 - ./core/archetypes/Tarot.js:113:      DB.users.set(user.id, {
 - ./core/commands/beta/debug.js:16:    DB.users.set(msg.author.id, { $inc: { "currency.RBN": AMT } }).then(() => {
 - ./core/commands/beta/debug.js:22:    DB.users.set(msg.author.id, { $inc: { "currency.SPH": AMT } }).then(() => {
 - ./core/commands/beta/debug.js:28:    DB.users.set(msg.author.id, { $inc: { "currency.JDE": AMT } }).then(() => {
 - ./core/commands/cosmetics/background.js:79:        return DB.users.set({ id: msg.author.id }, { $set: { "profile.bgID": selectedBG.code } });
 - ./core/commands/cosmetics/background.js:86:        DB.users.set({ id: msg.author.id }, { $set: { "profile.bgID": selectedBG.code } }),
 - ./core/commands/cosmetics/background.js:87:        DB.userInventory.set(msg.author.id, { $addToSet: { bgInventory: selectedBG.code } }),
 - ./core/commands/cosmetics/favcolor.js:42:  DB.users.set(msg.author.id, { $set: { "profile.favcolor": (`#${res.hex}`).replace("##", "#") } });
 - ./core/commands/cosmetics/fragment.js:100:        if (targetItem.type === "background") DB.userInventory.set(msg.author.id, { $pull: { bgInventory: targetItem.code } });
 - ./core/commands/cosmetics/fragment.js:101:        if (targetItem.type === "sticker") DB.userInventory.set(msg.author.id, { $pull: { stickerInventory: targetItem.id } });
 - ./core/commands/cosmetics/fragment.js:102:        if (targetItem.type === "medal") DB.userInventory.set(msg.author.id, { $pull: { medalInventory: targetItem.icon } });
 - ./core/commands/cosmetics/lootbox_generator.js:72:  const USERDATA = (await DB.users.getFull({ id: msg.author.id })) || (await DB.users.new(msg.author));
 - ./core/commands/cosmetics/lootbox_generator.js:76:    await DB.users.set(msg.author.id, { $inc: { "counters.cross_server_box_attempts": 1 } });
 - ./core/commands/cosmetics/lootbox_generator.js:138:        DB.users.set(USERDATA.id, lootbox.bonus.query),
 - ./core/commands/cosmetics/lootbox_generator.js:292:  if (loot.type === "background") return DB.userInventory.set(USERDATA.id, { $addToSet: { bgInventory: (loot.code || loot.id) } });
 - ./core/commands/cosmetics/lootbox_generator.js:294:  if (loot.type === "medal") return DB.userInventory.set(USERDATA.id, { $addToSet: { medalInventory: (loot.icon || loot.id) } });
 - ./core/commands/cosmetics/openbooster.js:45:    DB.userInventory.set(msg.author.id, { $addToSet: { stickerInventory: { $each: [stk1.id, stk2.id] } } }),
 - ./core/commands/cosmetics/synthesize/synthBg.js:17:      DB.users.set({ id: userData.id }, { $set: { "profile.bgID": selectedItem.code } }),
 - ./core/commands/cosmetics/synthesize/synthBg.js:18:      DB.userInventory.set(userData.id, { $addToSet: { bgInventory: selectedItem.code } }),
 - ./core/commands/cosmetics/synthesize/synthMedal.js:16:    return DB.userInventory.set(userData.id, { $addToSet: { medalInventory: selectedItem.icon } }).then(() => { });
 - ./core/commands/economy/balance.js:24:    DB.users.get({ id: Target.id }).then(d => d || DB.users.new(msg.author)),
 - ./core/commands/economy/local$.js:117:    await DB.audits.new(msg.author, amt, "local$_convert", eco.code); // NOTE audit is automatically made -- double auditing?
 - ./core/commands/economy/local$.js:135:    await DB.audits.new(msg.author, -amt, "local$_convert", eco.code);
 - ./core/commands/economy/marketplace/delete.js:10:    DB.marketplace.get({ $or: [{ id: args[0] }, { item_id: args[0] }], author: msg.author.id }),
 - ./core/commands/economy/marketplace/delete.js:11:    (await DB.marketbase({ fullbase: 1 })).fullbase,
 - ./core/commands/economy/marketplace/delete.js:18:    DB.marketplace.remove({ id: offer.id }).then((res) => {
 - ./core/commands/fun/responses.js:84:    await DB.responses.set(responseObject, { upsert: true });
 - ./core/commands/fun/responses.js:98:    await DB.responses.set(responseObject, { upsert: true });
 - ./core/commands/fun/responses.js:120:    await DB.responses.set(responseObject, { upsert: true });
 - ./core/commands/fun/responses.js:136:      DB.responses.new({
 - ./core/commands/games/blackjack.js:266:    await DB.users.set(msg.author.id, { "profile.skins.blackjack": "default" });
 - ./core/commands/games/blackjack.js:284:    await DB.users.set(msg.author.id, { "profile.skins.blackjack": targetDeck.localizer });
 - ./core/commands/games/guessflag.js:48:      await DB.rankings.collection.insert(data);
 - ./core/commands/games/hangmaid/index.js:177:      await DB.rankings.collection.insert(payload);
 - ./core/commands/img/kiss.js:60:    await DB.relationships.set({ _id: marriedtarget._id }, { $inc: { lovepoints: pris } });
 - ./core/commands/infra/migfix.js:34:        await DB.users.set(msg.author.id, { $set: { "switches.migrateFix.inv":true, "modules.inventory": Object.assign(newInventory,oldInventory) } }).catch(console.error);
 - ./core/commands/infra/migfix.js:66:        await DB.users.set(msg.author.id, { $inc: { "currency.SPH": -1 * (cost+(5*marryFixes||0)) || 0 } });
 - ./core/commands/infra/migrate.js:138:          await DB.users.set(msg.author.id, { $inc: { "currency.SPH": -1 * cost || 0 } });
 - ./core/commands/infra/migrate.js:167:          await DB.users.set(msg.author.id, { $set: { "modules.inventory": newInventory } }).catch(console.error);
 - ./core/commands/infra/migrate.js:181:          const updatedUserDB = DB.users.findOne({id:msg.author.id}).noCache().lean();
 - ./core/commands/infra/migrate.js:182:          let boxes = updatedUserDB.modules.inventory.filter(item=>item.id.includes('lootbox'));
 - ./core/commands/infra/migrate.js:184:          let bulk = await DB.users.bulkWrite(boxes.map(q=> ({
 - ./core/commands/infra/migrate.js:194:          await DB.users.set(msg.author.id, { $set: { "currency.PSM": exceedingBoxBonus } });
 - ./core/commands/infra/migrate.js:209:          await DB.users.set(msg.author.id, {
 - ./core/commands/infra/migrate.js:256:          let result = await DB.users.set(msg.author.id, { $addToSet: { 'modules.skinInventory': 'casino_touhou-classic' } }).catch(err => null);
 - ./core/commands/infra/migrate.js:278:          //await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
 - ./core/commands/infra/migrate.js:286:          await vDB.users.set(msg.author.id, { $set: { "switches.rankFrozen": true } });
 - ./core/commands/infra/migrate.js:287:          await DB.users.set(msg.author.id, { $set: { "counters.legacy.globalLV": userData_OLD.modules.level, "counters.legacy.globalXP": userData_OLD.modules.exp } });
 - ./core/commands/infra/migrate.js:301:            await DB.users.set(msg.author.id, { $set: { "prime.tier": oldDonoTier, "counters.prime_streak": oldDonoStreak } });
 - ./core/commands/infra/migrate.js:308:          // await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
 - ./core/commands/infra/migrate.js:318:          await DB.users.set(msg.author.id, {
 - ./core/commands/infra/migrate.js:337:          // await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
 - ./core/commands/infra/migrate.js:377:      await vDB.users.set(msg.author.id, { $set: { "migrated": true } });
 - ./core/commands/infra/migrate.js:378:      await DB.users.set(msg.author.id, { $set: { "migrated": true } });
 - ./core/commands/infra/migrate.js:402:      await vDB.users.set(msg.author.id, { $set: { "switches.tokensMigrated": true } });
 - ./core/commands/infra/prime.js:45:      await DB.users.set(msg.author.id, {$pull: { "prime.servers": SVdata.id }});
 - ./core/commands/infra/prime.js:74:    await DB.users.set(msg.author.id, {
 - ./core/commands/infra/prime.js:77:    await DB.users.set(msg.author.id, {
 - ./core/commands/misc/activateprime.js:46:  //await DB.servers.set(SVdata.id,{$set:{'premium' : true}});
 - ./core/commands/misc/activateprime.js:47:  //await DB.users.set(msg.author.id,{$inc:{'prime.servers' : 1}});
 - ./core/commands/misc/activateprime.js:48:  await DB.users.set(msg.author.id, { $set: { 'prime.maxServers': MAXPREM } });
 - ./core/commands/misc/activateprime.js:49:  await DB.users.set(msg.author.id, { $push: { 'prime.servers': msg.args[0] } });
 - ./core/commands/misc/claimtokens.js:9:    await DB.users.set(msg.author.id, { $set: { "currency.EVT": oldUser.eventGoodie  || 0} });
 - ./core/commands/misc/claimtokens.js:10:    await vDB.users.set(msg.author.id, { $set: { "switches.tokensMigrated2": true } });
 - ./core/commands/misc/mrgt.js:180:		await DB.users.set(msg.author.id, { $inc: { "switches.migrateFix.marry":1} }).catch(console.error);
 - ./core/commands/moderation/lang.js:10:          await DB.channels.set(interaction.message.channel.id, { "modules.LANGUAGE": langTo.iso });
 - ./core/commands/moderation/lang.js:14:      await DB.servers.set(interaction.guild.id, { "modules.LANGUAGE": langTo.iso });
 - ./core/commands/moderation/mute.js:19:    await DB.servers.new(msg.guild);
 - ./core/commands/moderation/mute.js:119:        DB.servers.set(Server.id, { $set: { "modules.MUTEROLE": role.id } });
 - ./core/commands/moderation/paidroles.js:29:    await DB.paidroles.new({
 - ./core/commands/moderation/paidroles.js:52:    await DB.paidroles.remove({ role: target.role });
 - ./core/commands/moderation/reactionroles.js:40:              DB.reactRoles.set({ message: message.id, channel, server: msg.guild.id }, { $addToSet: { rolemoji: { role: role.id, emoji: argmoji } } }).then((db) => {
 - ./core/commands/moderation/reactionroles.js:84:        DB.reactRoles.set({ server: msg.guild.id, message: arg1 }, { $pull: { rolemoji: reactionItem } });
 - ./core/commands/moderation/reactionroles.js:89:        await DB.reactRoles.remove({ server: msg.guild.id, message: arg1 });
 - ./core/commands/moderation/reactionroles.js:103:    await DB.reactRoles.remove({ server: msg.guild.id });
 - ./core/commands/pollux/adventure.js:166:  DB.advJourneys.new(msg.author.id, Adventure, Adventure.journey);
 - ./core/commands/pollux/rewards.js:191:        await DB.users.set(msg.author.id,{$addToSet:{'modules.stickerInventory': "australis21stk" }});
 - ./core/commands/roleplay/attribute.js:28:      await DB.users.set({ id: message.author.id, "switches.variables.tag": tag }, { $set: { "switches.variables.$.value": value } });
 - ./core/commands/roleplay/attribute.js:30:      await DB.users.set(message.author.id, { $push: { "switches.variables": { tag, value } } });
 - ./core/commands/roleplay/attribute.js:37:      await DB.users.set({ id: message.author.id, "switches.variables.tag": tag }, { $set: { "switches.variables.$.tag": value } });
 - ./core/commands/roleplay/attribute.js:39:      await DB.users.set(message.author.id, { $push: { "switches.variables": { tag, value } } });
 - ./core/commands/roleplay/attribute.js:45:      await DB.users.set({ id: message.author.id }, { $set: { "switches.variables": [] } });
 - ./core/commands/roleplay/attribute.js:47:      await DB.users.set({ id: message.author.id }, { $pull: { "switches.variables": { tag } } });
 - ./core/commands/social/editprofile.js:33:  const userData = (await DB.users.get(msg.author.id)) || (await DB.users.new(msg.author));
 - ./core/commands/social/gift/give.js:22:  await DB.gifts.updateOne({ _id: gift._id }, update);
 - ./core/commands/social/gift/open.js:51:        await DB.gifts.remove({ _id: gift._id });
 - ./core/commands/social/gift/open.js:55:        await DB.users.set(msg.author.id, { $addToSet: { [`modules.${ giftMetadata.inventory}`]: gift.item } });
 - ./core/commands/social/gift/wrap.js:182:      await DB.users.set(msg.author.id, destroystring);
 - ./core/commands/social/gift/wrap.js:183:      await DB.gifts.set(Date.now(), giftItem);
 - ./core/commands/social/marry.js:260:		DB.users.set(Target.id, { featuredMarriage: THIS_MARRIAGE_ID });
 - ./core/commands/social/marry.js:267:		DB.users.set(msg.author.id, { featuredMarriage: THIS_MARRIAGE_ID });
 - ./core/commands/social/marry.js:510:				DB.relationships.set( {_id: selectedRel._id} , {$set: {ring: val }});
 - ./core/commands/social/marry.js:518:				DB.users.set(msg.author.id, {$set: {featuredMarriage: val }});				
 - ./core/commands/social/marry.js:569:			await DB.relationships.set({ _id: THIS_MARRIAGE_ID }, { $addToSet: {ringCollection: RING.id }, $set: { ring: RING.id } });
 - ./core/commands/social/personaltext.js:10:  await DB.users.set(msg.author.id, { $set: { "profile.persotext": persotxt } });
 - ./core/commands/social/profile-v1.js:142:      DB.users.set(msg.author.id, {
 - ./core/commands/social/profile-v1.js:150:      DB.users.set(msg.author.id, {
 - ./core/commands/social/profile.js:154:    const dDATA = (await DB.users.get(msg.author.id)) || DB.users.new(msg.author);
 - ./core/commands/social/profile.js:158:      DB.users.set(msg.author.id, {
 - ./core/commands/social/profile.js:167:      DB.users.set(msg.author.id, {
 - ./core/commands/social/profile.js:191:  let Target_Database = (await DB.users.findOne({ id: Target.id }).noCache().populate("marriageData")) || (await DB.users.new(Target));
 - ./core/commands/social/tagline.js:10:  await DB.users.set(msg.author.id, { $set: { "profile.tagline": persotxt } });
 - ./core/commands/social/thanks.js:16:    await DB.localranks.set({ user: Target.id, server: msg.guild.id }, { $inc: { thx: 1 } });
 - ./core/commands/social/thanks.js:97:            await DB.localranks.set({ user: Target.id, server: msg.guild.id }, { thx: 0 }).catch((err) => {
 - ./core/commands/utility/chdeck.js:5:      await DB.users.set(msg.author.id, { $addToSet: { "switches.channeldeck": { $each: targetChannels } } });
 - ./core/commands/utility/chdeck.js:11:      await DB.users.set(msg.author.id, { $pull: { "switches.channeldeck": { $each: [targetChannels] } } });
 - ./core/commands/utility/reminder.js:48:    await DB.feed.deleteOne({ _id: targetReminder._id });
 - ./core/commands/utility/reminder.js:94:  await DB.feed.new({
 - ./core/commands/utility/rss.js:31:			await DB.feed.set({ server: msg.guild.id, url: str }, { $set: { channel } });
 - ./core/commands/utility/rss.js:65:			// await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});
 - ./core/commands/utility/rss.js:66:			await DB.feed.deleteOne({ server: msg.guild.id, url: toDelete.url });
 - ./core/commands/utility/rss.js:85:		await DB.servers.set({ id: msg.guild.id }, { $set: { "modules.defaultRSSChannel": channel } });
 - ./core/commands/utility/say.js:59:  await DB.control.collection.insert({
 - ./core/commands/utility/tag.js:66:  await DB.responses.deleteOne({ server:msg.guild.id, tag });
 - ./core/commands/utility/tag.js:115:    await DB.responses.set(responseObject, { upsert: true });
 - ./core/commands/utility/tag.js:129:    await DB.responses.set(responseObject, { upsert: true });
 - ./core/commands/utility/tag.js:153:    await DB.responses.set(responseObject, { upsert: true });
 - ./core/commands/utility/tag.js:169:      DB.responses.new({
 - ./core/commands/utility/twitchalert.js:69:                await DB.feed.deleteOne({ server: msg.guild.id, _id: todelete._id });
 - ./core/commands/utility/ytalert.js:43:      await DB.feed.set({ server: msg.guild.id, url: channelID }, { $set: { channel } });
 - ./core/commands/utility/ytalert.js:51:    await DB.feed.new(payload);
 - ./core/commands/utility/ytalert.js:80:      // await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});
 - ./core/commands/utility/ytalert.js:81:      await DB.feed.deleteOne({ server: msg.guild.id, url: toDelete.url });
 - ./core/commands/utility/ytalert.js:100:    await DB.feed.set({ server: msg.guild.id }, { $set: { defaultChannel: channel } });
 - ./core/commands/_botOwner/istranslator.js:4:  await DB.users.set(Target.id, { $set: { "switches.role": "translator", "switches.translator": args[0].toUpperCase() } });
 - ./core/commands/_botOwner/primerollout.js:43:        let res = await DB.cosmetics.updateOne({ id: composeStickerName() }, { $set: { name: newName || thisSticker.name, public: true } }).catch(err => null);
 - ./core/commands/_botOwner/primerollout.js:56:            DB.users.updateMany({ "prime.active": true }, { "prime.active": false }),
 - ./core/commands/_botOwner/primerollout.js:57:            DB.users.updateMany({ "donator": { $exists: true } }, { "donator": null }),
 - ./core/commands/_botStaff/fanartApprove.js:13:        return DB.fanart.updateOne({ hash }, { $set: { publish: false, 'extras.rank': 99 } })
 - ./core/commands/_botStaff/fanartApprove.js:17:    await DB.fanart.updateOne({ hash }, { $set: { publish: true, 'extras.rank': 1 } })
 - ./core/structures/CommandPreprocessor.js:134:      DB.users.new(m.author).catch((err) => null);
 - ./core/structures/CommandPreprocessor.js:176:    if (!knownError) await DB.globals.updateOne({code: errorCode},{ $set:{ known: false , type: "errorCode"},$inc:{ocurrences: 1} });
 - ./core/structures/CommandPreprocessor.js:177:    else await DB.globals.updateOne({code: errorCode}, { $inc:{ocurrences: 1} });
 - ./core/structures/TimedUsage.js:52:        await DB.users.set(user.id, {
 - ./core/structures/TimedUsage.js:65:      await DB.users.set(user.id, {
 - ./core/structures/TimedUsage.js:72:    await DB.users.set(user.id, {
 - ./core/structures/TimedUsage.js:157:    DB.users.set(Author.id, {
 - ./core/structures/TimedUsage.js:165:      await DB.users.set(Author.id, {
 - ./core/structures/TimedUsage.js:169:      await DB.users.set(Author.id, {
 - ./core/structures/_legacy_userdb_shim.js:123:    await DB.users.updateOne(
 - ./core/structures/_legacy_userdb_shim.js:206:    await DB.userInventory.updateOne(
 - ./core/structures/_legacy_userdb_shim.js:365:    await DB._legacyUserDB.updateOne(
 - ./core/subroutines/boxDrops.js:129:      return DB.users.set(trigger.author.id, { $inc: { "progression.exp": -10 } });
 - ./core/subroutines/boxDrops.js:341:        DB.users.set({ id: { $in: ids } }, { $inc: { "progression.exp": 100 } }),
 - ./core/subroutines/boxDrops.js:342:        DB.users.set(luckyOne.id, { $inc: { "progression.exp": 500 } }),
 - ./core/subroutines/boxDrops.js:343:        DB.control.set(
 - ./core/subroutines/boxDrops.js:351:        DB.control.set({ id: { $in: ids } }, { $inc: { "data.boxesLost": 1 } }),
 - ./core/subroutines/feeds/rss.js:44:		await DB.feed.updateOne(
 - ./core/subroutines/feeds/rss.js:69:					await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
 - ./core/subroutines/feeds/rss.js:72:					await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
 - ./core/subroutines/feeds/rss.js:92:				await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
 - ./core/subroutines/feeds/rss.js:94:				await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
 - ./core/subroutines/feeds/twitch.js:65:    await DB.feed.updateOne(
 - ./core/subroutines/feeds/youtube.js:39:    await DB.feed.updateOne(
 - ./core/subroutines/globalLevelUp.js:35:const commitLevel = (U,L) => DB.users.set(U, { $set: { "progression.level": L } });
 - ./core/subroutines/localLevelUp.js:22:	if (!LOCAL_RANK) return DB.localranks.new({ U: userID, S: serverID, level: 0, exp: 0 });
 - ./core/subroutines/localLevelUp.js:37:		await DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
 - ./core/subroutines/localLevelUp.js:52:		DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
 - ./core/subroutines/microtasks/serverCache.js:20:        if (!sv.cluster) DB.servers.set({ id: sv.id }, { cluster: PLX.cluster.id });
 - ./core/subroutines/onEveryCommand.js:5:    DB.users.updateMeta(msg.author);
 - ./core/subroutines/onEveryCommand.js:6:    if (msg.guild) DB.serverDB.updateMeta(msg.guild);
 - ./core/subroutines/onEveryCommand.js:22:    return DB.users.updateOne({ id: usID }, { $inc: { "progression.exp": EXP } }, { upsert: false }).lean().exec();
 - ./core/subroutines/onEveryCommand.js:29:      DB.globalDB.set({
 - ./core/subroutines/onEveryCommand.js:35:      DB.control.set(message.author.id, {
 - ./core/subroutines/onEveryCommand.js:45:          return DB.control.set(message.guild.id, {
 - ./core/subroutines/updateGuildSettings.js:10:        || await JSON.parse( (await PLX.redis.aget(`${DB.raw.db.databaseName}.serverdb.findOne.{"id":"${thisServer.id}"}`))||"null" )
 - ./core/subroutines/updateGuildSettings.js:11:        || await DB.servers.findOne({id:thisServer.id}).cache();
 - ./core/utilities/_Gearbox.bak:46:    DB.users.new(user.user||user);
 - ./DB_Interactions.md:41:core/archetypes/Progression.js: ... DB.users.findOne ... DB.users.updateOne ... DB.quests.find ...
 - ./DB_Interactions.md:42:core/archetypes/Redeem.js: ... DB.promocodes.findOne/updateOne ... DB.users.getFull ... DB.cosmetics.get ... DB.audits.new ...
 - ./DB_Interactions.md:418: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:18:    //  return DB.progression.set({achievement,user,type:'achievement'},{$set: {awarded:true} } );
 - ./DB_Interactions.md:419: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:30:      return DB.progression.set({achievement,user,type:'achievement'},{$inc: {tracker:value} } );
 - ./DB_Interactions.md:420: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:33:      //return DB.progression.set({achievement,user,type:'achievement'},{$set: {tracker:value} } );
 - ./DB_Interactions.md:421: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Achievements.js:141:    DB.users.set(uID, { $inc: { "progression.exp": awarded.exp || 100 } });
 - ./DB_Interactions.md:422: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:16:        return DB.airlines.SLOTS.new((await (this.airline)).id, airportData.id, time);
 - ./DB_Interactions.md:423: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:35:    return DB.airlines.AIRLINES.new(ownerID, airlineID, airlineName);
 - ./DB_Interactions.md:424: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Airline.js:39:    return DB.airlines.ROUTES.new(departure, destination, this.id, airplane, ticketPrice);
 - ./DB_Interactions.md:425: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:290:      DB.userInventory.bulkWrite(cosmeticsToWrite),
 - ./DB_Interactions.md:426: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:291:      DB.users.bulkWrite(toWrite),
 - ./DB_Interactions.md:427: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Crafter.js:299:      return DB.audits.collection.insertMany(payloads)
 - ./DB_Interactions.md:428: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:390:  await DB.users.bulkWrite(toWrite);
 - ./DB_Interactions.md:429: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:391:  await DB.audits.collection.insertMany(payloads);
 - ./DB_Interactions.md:430: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Economy.js:415:  await DB.audits.new({ ...fields, ...payload });
 - ./DB_Interactions.md:431: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:477:    await DB.users.set(userID, { $set: { "counters.prime_streak": {} } });
 - ./DB_Interactions.md:432: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:483:  if (!tierStreaks || !currentTierStreak)  await DB.users.set(userID, { $set: { [`counters.prime_streak.${currentTier}`]: 1 } });
 - ./DB_Interactions.md:433: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:484:  else await DB.users.set(userID, { $inc: { [`counters.prime_streak.${currentTier}`]: 1 } });
 - ./DB_Interactions.md:434: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:486:  if (!totalStreak) await DB.users.set(userID, { $set: { "counters.prime_streak.total": 1 } });
 - ./DB_Interactions.md:435: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:487:  else await DB.users.set(userID, { $inc: { "counters.prime_streak.total": 1 } });
 - ./DB_Interactions.md:436: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:648:    //await DB.users.set(userID, { "modules.EVT": 0 }).catch((err) => { console.error(err); return null; });
 - ./DB_Interactions.md:437: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:654:    ? await DB.userInventory.bulkWrite(bulkWriteQuery).catch((err) => { console.error(err); return null; })
 - ./DB_Interactions.md:438: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:656:  const q2 = await DB.users.set(userID, regularQuery).catch((err) => { console.error(err); return null; });
 - ./DB_Interactions.md:439: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Premium.js:658:    ? await DB.userInventory.set(userID, cosmeticsQuery).catch((err) => { console.error(err); return null; })
 - ./DB_Interactions.md:440: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:102:                await DB.users.set(userID, {
 - ./DB_Interactions.md:441: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:136:        await DB.users.updateOne({ id: userID, "quests._id": questUniqueID }, { $inc: { 'quests.$.progress': value } }, { new: !0 });
 - ./DB_Interactions.md:442: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:141:        await DB.users.updateOne({ id: userID, "quests._id": questUniqueID }, { $set: { 'quests.$.progress': value } }, { new: !0 });
 - ./DB_Interactions.md:443: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:146:        await DB.users.set(userID, { $set: { quests } });
 - ./DB_Interactions.md:444: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:168:                    await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - ./DB_Interactions.md:445: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:172:                    await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - ./DB_Interactions.md:446: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:191:            await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - ./DB_Interactions.md:447: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:195:            await DB.users.updateOne({ id: userID, "quests._id": quest._id }, { $set: { 'quests.$.completed': true } }, { new: !0 });
 - ./DB_Interactions.md:448: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:210:        await DB.users.set(userID, { $push: { quests: newQuest } });
 - ./DB_Interactions.md:449: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:217:        await DB.users.set(userID, { $pull: { "quests": { id: questID } } });
 - ./DB_Interactions.md:450: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:222:        await DB.users.set(userID, { $push: { quests: newQuest } });
 - ./DB_Interactions.md:451: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Progression.js:309:    await DB.users.set(userID, {
 - ./DB_Interactions.md:452: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:16:    return DB.promocodes.updateOne({ code: this.code}, {locked: true});
 - ./DB_Interactions.md:453: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:19:    return DB.promocodes.updateOne({ code: this.code}, {locked: false});
 - ./DB_Interactions.md:454: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:45:    let res = await DB.promocodes.updateOne({ code: this.code }, query);
 - ./DB_Interactions.md:455: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:162:        await DB.promocodes.updateOne({ code }, {
 - ./DB_Interactions.md:456: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:186:      await DB.users.set(this.user, {$addToSet: {[`modules.${sPrize.inventory}`]: prizeItem.code||prizeItem.icon||prizeItem.id } } );
 - ./DB_Interactions.md:457: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Redeem.js:196:    return DB.audits.new({
 - ./DB_Interactions.md:458: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:146:      if (!guildobj) guildobj = DB.guilds.new(this._guild); // FIXME Both of these return void?
 - ./DB_Interactions.md:459: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:147:      if (!channelobj) channelobj = DB.channels.new(this._channel);
 - ./DB_Interactions.md:460: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:177:      DB.servers.set(this._guild.id, { $set: { "modules.DISABLED": this.gd } }),
 - ./DB_Interactions.md:461: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Switch.js:178:      DB.channels.set(this._channel.id, { $set: { "modules.DISABLED": this.cd, "modules.ENABLED": this.ce } }),
 - ./DB_Interactions.md:462: - z:/POLLUX/POLARIS/DEV/bot/core/archetypes/Tarot.js:113:      DB.users.set(user.id, {
 - ./DB_Interactions.md:463: - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:16:    DB.users.set(msg.author.id, { $inc: { "currency.RBN": AMT } }).then(() => {
 - ./DB_Interactions.md:464: - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:22:    DB.users.set(msg.author.id, { $inc: { "currency.SPH": AMT } }).then(() => {
 - ./DB_Interactions.md:465: - z:/POLLUX/POLARIS/DEV/bot/core/commands/beta/debug.js:28:    DB.users.set(msg.author.id, { $inc: { "currency.JDE": AMT } }).then(() => {
 - ./DB_Interactions.md:466: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:79:        return DB.users.set({ id: msg.author.id }, { $set: { "profile.bgID": selectedBG.code } });
 - ./DB_Interactions.md:467: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:86:        DB.users.set({ id: msg.author.id }, { $set: { "profile.bgID": selectedBG.code } }),
 - ./DB_Interactions.md:468: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/background.js:87:        DB.userInventory.set(msg.author.id, { $addToSet: { bgInventory: selectedBG.code } }),
 - ./DB_Interactions.md:469: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/favcolor.js:42:  DB.users.set(msg.author.id, { $set: { "profile.favcolor": (`#${res.hex}`).replace("##", "#") } });
 - ./DB_Interactions.md:470: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:100:        if (targetItem.type === "background") DB.userInventory.set(msg.author.id, { $pull: { bgInventory: targetItem.code } });
 - ./DB_Interactions.md:471: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:101:        if (targetItem.type === "sticker") DB.userInventory.set(msg.author.id, { $pull: { stickerInventory: targetItem.id } });
 - ./DB_Interactions.md:472: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/fragment.js:102:        if (targetItem.type === "medal") DB.userInventory.set(msg.author.id, { $pull: { medalInventory: targetItem.icon } });
 - ./DB_Interactions.md:473: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:72:  const USERDATA = (await DB.users.getFull({ id: msg.author.id })) || (await DB.users.new(msg.author));
 - ./DB_Interactions.md:474: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:76:    await DB.users.set(msg.author.id, { $inc: { "counters.cross_server_box_attempts": 1 } });
 - ./DB_Interactions.md:475: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:138:        DB.users.set(USERDATA.id, lootbox.bonus.query),
 - ./DB_Interactions.md:476: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:292:  if (loot.type === "background") return DB.userInventory.set(USERDATA.id, { $addToSet: { bgInventory: (loot.code || loot.id) } });
 - ./DB_Interactions.md:477: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/lootbox_generator.js:294:  if (loot.type === "medal") return DB.userInventory.set(USERDATA.id, { $addToSet: { medalInventory: (loot.icon || loot.id) } });
 - ./DB_Interactions.md:478: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/openbooster.js:45:    DB.userInventory.set(msg.author.id, { $addToSet: { stickerInventory: { $each: [stk1.id, stk2.id] } } }),
 - ./DB_Interactions.md:479: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthBg.js:17:      DB.users.set({ id: userData.id }, { $set: { "profile.bgID": selectedItem.code } }),
 - ./DB_Interactions.md:480: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthBg.js:18:      DB.userInventory.set(userData.id, { $addToSet: { bgInventory: selectedItem.code } }),
 - ./DB_Interactions.md:481: - z:/POLLUX/POLARIS/DEV/bot/core/commands/cosmetics/synthesize/synthMedal.js:16:    return DB.userInventory.set(userData.id, { $addToSet: { medalInventory: selectedItem.icon } }).then(() => { });
 - ./DB_Interactions.md:482: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/balance.js:24:    DB.users.get({ id: Target.id }).then(d => d || DB.users.new(msg.author)),
 - ./DB_Interactions.md:483: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/local$.js:117:    await DB.audits.new(msg.author, amt, "local$_convert", eco.code); // NOTE audit is automatically made -- double auditing?
 - ./DB_Interactions.md:484: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/local$.js:135:    await DB.audits.new(msg.author, -amt, "local$_convert", eco.code);
 - ./DB_Interactions.md:485: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/delete.js:10:    DB.marketplace.get({ $or: [{ id: args[0] }, { item_id: args[0] }], author: msg.author.id }),
 - ./DB_Interactions.md:486: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/delete.js:11:    (await DB.marketbase({ fullbase: 1 })).fullbase,
 - ./DB_Interactions.md:487: - z:/POLLUX/POLARIS/DEV/bot/core/commands/economy/marketplace/delete.js:18:    DB.marketplace.remove({ id: offer.id }).then((res) => {
 - ./DB_Interactions.md:488: - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:84:    await DB.responses.set(responseObject, { upsert: true });
 - ./DB_Interactions.md:489: - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:98:    await DB.responses.set(responseObject, { upsert: true });
 - ./DB_Interactions.md:490: - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:120:    await DB.responses.set(responseObject, { upsert: true });
 - ./DB_Interactions.md:491: - z:/POLLUX/POLARIS/DEV/bot/core/commands/fun/responses.js:136:      DB.responses.new({
 - ./DB_Interactions.md:492: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:266:    await DB.users.set(msg.author.id, { "profile.skins.blackjack": "default" });
 - ./DB_Interactions.md:493: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/blackjack.js:284:    await DB.users.set(msg.author.id, { "profile.skins.blackjack": targetDeck.localizer });
 - ./DB_Interactions.md:494: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/guessflag.js:48:      await DB.rankings.collection.insert(data);
 - ./DB_Interactions.md:495: - z:/POLLUX/POLARIS/DEV/bot/core/commands/games/hangmaid/index.js:177:      await DB.rankings.collection.insert(payload);
 - ./DB_Interactions.md:496: - z:/POLLUX/POLARIS/DEV/bot/core/commands/img/kiss.js:60:    await DB.relationships.set({ _id: marriedtarget._id }, { $inc: { lovepoints: pris } });
 - ./DB_Interactions.md:497: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:34:        await DB.users.set(msg.author.id, { $set: { "switches.migrateFix.inv":true, "modules.inventory": Object.assign(newInventory,oldInventory) } }).catch(console.error);
 - ./DB_Interactions.md:498: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migfix.js:66:        await DB.users.set(msg.author.id, { $inc: { "currency.SPH": -1 * (cost+(5*marryFixes||0)) || 0 } });
 - ./DB_Interactions.md:499: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:138:          await DB.users.set(msg.author.id, { $inc: { "currency.SPH": -1 * cost || 0 } });
 - ./DB_Interactions.md:500: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:167:          await DB.users.set(msg.author.id, { $set: { "modules.inventory": newInventory } }).catch(console.error);
 - ./DB_Interactions.md:501: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:181:          const updatedUserDB = DB.users.findOne({id:msg.author.id}).noCache().lean();
 - ./DB_Interactions.md:502: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:182:          let boxes = updatedUserDB.modules.inventory.filter(item=>item.id.includes('lootbox'));
 - ./DB_Interactions.md:503: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:184:          let bulk = await DB.users.bulkWrite(boxes.map(q=> ({
 - ./DB_Interactions.md:504: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:194:          await DB.users.set(msg.author.id, { $set: { "currency.PSM": exceedingBoxBonus } });
 - ./DB_Interactions.md:505: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:209:          await DB.users.set(msg.author.id, {
 - ./DB_Interactions.md:506: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:256:          let result = await DB.users.set(msg.author.id, { $addToSet: { 'modules.skinInventory': 'casino_touhou-classic' } }).catch(err => null);
 - ./DB_Interactions.md:507: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:278:          //await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
 - ./DB_Interactions.md:508: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:286:          await vDB.users.set(msg.author.id, { $set: { "switches.rankFrozen": true } });
 - ./DB_Interactions.md:509: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:287:          await DB.users.set(msg.author.id, { $set: { "counters.legacy.globalLV": userData_OLD.modules.level, "counters.legacy.globalXP": userData_OLD.modules.exp } });
 - ./DB_Interactions.md:510: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:301:            await DB.users.set(msg.author.id, { $set: { "prime.tier": oldDonoTier, "counters.prime_streak": oldDonoStreak } });
 - ./DB_Interactions.md:511: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:308:          // await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
 - ./DB_Interactions.md:512: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:318:          await DB.users.set(msg.author.id, {
 - ./DB_Interactions.md:513: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:337:          // await DB.users.set(msg.author.id, {$set:{'modules.bgInventory': myBGsFULL.map(b=>b.id) }});
 - ./DB_Interactions.md:514: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:377:      await vDB.users.set(msg.author.id, { $set: { "migrated": true } });
 - ./DB_Interactions.md:515: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:378:      await DB.users.set(msg.author.id, { $set: { "migrated": true } });
 - ./DB_Interactions.md:516: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/migrate.js:402:      await vDB.users.set(msg.author.id, { $set: { "switches.tokensMigrated": true } });
 - ./DB_Interactions.md:517: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:45:      await DB.users.set(msg.author.id, {$pull: { "prime.servers": SVdata.id }});
 - ./DB_Interactions.md:518: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:74:    await DB.users.set(msg.author.id, {
 - ./DB_Interactions.md:519: - z:/POLLUX/POLARIS/DEV/bot/core/commands/infra/prime.js:77:    await DB.users.set(msg.author.id, {
 - ./DB_Interactions.md:520: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:46:  //await DB.servers.set(SVdata.id,{$set:{'premium' : true}});
 - ./DB_Interactions.md:521: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:47:  //await DB.users.set(msg.author.id,{$inc:{'prime.servers' : 1}});
 - ./DB_Interactions.md:522: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:48:  await DB.users.set(msg.author.id, { $set: { 'prime.maxServers': MAXPREM } });
 - ./DB_Interactions.md:523: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/activateprime.js:49:  await DB.users.set(msg.author.id, { $push: { 'prime.servers': msg.args[0] } });
 - ./DB_Interactions.md:524: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/claimtokens.js:9:    await DB.users.set(msg.author.id, { $set: { "currency.EVT": oldUser.eventGoodie  || 0} });
 - ./DB_Interactions.md:525: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/claimtokens.js:10:    await vDB.users.set(msg.author.id, { $set: { "switches.tokensMigrated2": true } });
 - ./DB_Interactions.md:526: - z:/POLLUX/POLARIS/DEV/bot/core/commands/misc/mrgt.js:180:		await DB.users.set(msg.author.id, { $inc: { "switches.migrateFix.marry":1} }).catch(console.error);
 - ./DB_Interactions.md:527: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/lang.js:10:          await DB.channels.set(interaction.message.channel.id, { "modules.LANGUAGE": langTo.iso });
 - ./DB_Interactions.md:528: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/lang.js:14:      await DB.servers.set(interaction.guild.id, { "modules.LANGUAGE": langTo.iso });
 - ./DB_Interactions.md:529: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:19:    await DB.servers.new(msg.guild);
 - ./DB_Interactions.md:530: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/mute.js:119:        DB.servers.set(Server.id, { $set: { "modules.MUTEROLE": role.id } });
 - ./DB_Interactions.md:531: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/paidroles.js:29:    await DB.paidroles.new({
 - ./DB_Interactions.md:532: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/paidroles.js:52:    await DB.paidroles.remove({ role: target.role });
 - ./DB_Interactions.md:533: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:40:              DB.reactRoles.set({ message: message.id, channel, server: msg.guild.id }, { $addToSet: { rolemoji: { role: role.id, emoji: argmoji } } }).then((db) => {
 - ./DB_Interactions.md:534: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:84:        DB.reactRoles.set({ server: msg.guild.id, message: arg1 }, { $pull: { rolemoji: reactionItem } });
 - ./DB_Interactions.md:535: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:89:        await DB.reactRoles.remove({ server: msg.guild.id, message: arg1 });
 - ./DB_Interactions.md:536: - z:/POLLUX/POLARIS/DEV/bot/core/commands/moderation/reactionroles.js:103:    await DB.reactRoles.remove({ server: msg.guild.id });
 - ./DB_Interactions.md:537: - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/adventure.js:166:  DB.advJourneys.new(msg.author.id, Adventure, Adventure.journey);
 - ./DB_Interactions.md:538: - z:/POLLUX/POLARIS/DEV/bot/core/commands/pollux/rewards.js:191:        await DB.users.set(msg.author.id,{$addToSet:{'modules.stickerInventory': "australis21stk" }});
 - ./DB_Interactions.md:539: - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:28:      await DB.users.set({ id: message.author.id, "switches.variables.tag": tag }, { $set: { "switches.variables.$.value": value } });
 - ./DB_Interactions.md:540: - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:30:      await DB.users.set(message.author.id, { $push: { "switches.variables": { tag, value } } });
 - ./DB_Interactions.md:541: - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:37:      await DB.users.set({ id: message.author.id, "switches.variables.tag": tag }, { $set: { "switches.variables.$.tag": value } });
 - ./DB_Interactions.md:542: - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:39:      await DB.users.set(message.author.id, { $push: { "switches.variables": { tag, value } } });
 - ./DB_Interactions.md:543: - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:45:      await DB.users.set({ id: message.author.id }, { $set: { "switches.variables": [] } });
 - ./DB_Interactions.md:544: - z:/POLLUX/POLARIS/DEV/bot/core/commands/roleplay/attribute.js:47:      await DB.users.set({ id: message.author.id }, { $pull: { "switches.variables": { tag } } });
 - ./DB_Interactions.md:545: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/editprofile.js:33:  const userData = (await DB.users.get(msg.author.id)) || (await DB.users.new(msg.author));
 - ./DB_Interactions.md:546: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/give.js:22:  await DB.gifts.updateOne({ _id: gift._id }, update);
 - ./DB_Interactions.md:547: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:51:        await DB.gifts.remove({ _id: gift._id });
 - ./DB_Interactions.md:548: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/open.js:55:        await DB.users.set(msg.author.id, { $addToSet: { [`modules.${ giftMetadata.inventory}`]: gift.item } });
 - ./DB_Interactions.md:549: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/wrap.js:182:      await DB.users.set(msg.author.id, destroystring);
 - ./DB_Interactions.md:550: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/gift/wrap.js:183:      await DB.gifts.set(Date.now(), giftItem);
 - ./DB_Interactions.md:551: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:260:		DB.users.set(Target.id, { featuredMarriage: THIS_MARRIAGE_ID });
 - ./DB_Interactions.md:552: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:267:		DB.users.set(msg.author.id, { featuredMarriage: THIS_MARRIAGE_ID });
 - ./DB_Interactions.md:553: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:510:				DB.relationships.set( {_id: selectedRel._id} , {$set: {ring: val }});
 - ./DB_Interactions.md:554: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:518:				DB.users.set(msg.author.id, {$set: {featuredMarriage: val }});				
 - ./DB_Interactions.md:555: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/marry.js:569:			await DB.relationships.set({ _id: THIS_MARRIAGE_ID }, { $addToSet: {ringCollection: RING.id }, $set: { ring: RING.id } });
 - ./DB_Interactions.md:556: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/personaltext.js:10:  await DB.users.set(msg.author.id, { $set: { "profile.persotext": persotxt } });
 - ./DB_Interactions.md:557: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile-v1.js:142:      DB.users.set(msg.author.id, {
 - ./DB_Interactions.md:558: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile-v1.js:150:      DB.users.set(msg.author.id, {
 - ./DB_Interactions.md:559: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile.js:154:    const dDATA = (await DB.users.get(msg.author.id)) || DB.users.new(msg.author);
 - ./DB_Interactions.md:560: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile.js:158:      DB.users.set(msg.author.id, {
 - ./DB_Interactions.md:561: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile.js:167:      DB.users.set(msg.author.id, {
 - ./DB_Interactions.md:562: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/profile.js:191:  let Target_Database = (await DB.users.findOne({ id: Target.id }).noCache().populate("marriageData")) || (await DB.users.new(Target));
 - ./DB_Interactions.md:563: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/tagline.js:10:  await DB.users.set(msg.author.id, { $set: { "profile.tagline": persotxt } });
 - ./DB_Interactions.md:564: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/thanks.js:16:    await DB.localranks.set({ user: Target.id, server: msg.guild.id }, { $inc: { thx: 1 } });
 - ./DB_Interactions.md:565: - z:/POLLUX/POLARIS/DEV/bot/core/commands/social/thanks.js:97:            await DB.localranks.set({ user: Target.id, server: msg.guild.id }, { thx: 0 }).catch((err) => {
 - ./DB_Interactions.md:566: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/chdeck.js:5:      await DB.users.set(msg.author.id, { $addToSet: { "switches.channeldeck": { $each: targetChannels } } });
 - ./DB_Interactions.md:567: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/chdeck.js:11:      await DB.users.set(msg.author.id, { $pull: { "switches.channeldeck": { $each: [targetChannels] } } });
 - ./DB_Interactions.md:568: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/reminder.js:48:    await DB.feed.deleteOne({ _id: targetReminder._id });
 - ./DB_Interactions.md:569: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/reminder.js:94:  await DB.feed.new({
 - ./DB_Interactions.md:570: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:31:			await DB.feed.set({ server: msg.guild.id, url: str }, { $set: { channel } });
 - ./DB_Interactions.md:571: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:65:			// await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});
 - ./DB_Interactions.md:572: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:66:			await DB.feed.deleteOne({ server: msg.guild.id, url: toDelete.url });
 - ./DB_Interactions.md:573: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/rss.js:85:		await DB.servers.set({ id: msg.guild.id }, { $set: { "modules.defaultRSSChannel": channel } });
 - ./DB_Interactions.md:574: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/say.js:59:  await DB.control.collection.insert({
 - ./DB_Interactions.md:575: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:66:  await DB.responses.deleteOne({ server:msg.guild.id, tag });
 - ./DB_Interactions.md:576: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:115:    await DB.responses.set(responseObject, { upsert: true });
 - ./DB_Interactions.md:577: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:129:    await DB.responses.set(responseObject, { upsert: true });
 - ./DB_Interactions.md:578: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:153:    await DB.responses.set(responseObject, { upsert: true });
 - ./DB_Interactions.md:579: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/tag.js:169:      DB.responses.new({
 - ./DB_Interactions.md:580: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/twitchalert.js:69:                await DB.feed.deleteOne({ server: msg.guild.id, _id: todelete._id });
 - ./DB_Interactions.md:581: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:43:      await DB.feed.set({ server: msg.guild.id, url: channelID }, { $set: { channel } });
 - ./DB_Interactions.md:582: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:51:    await DB.feed.new(payload);
 - ./DB_Interactions.md:583: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:80:      // await DB.feed.set({server:msg.guild.id},{$pull:{feeds:toDelete}});
 - ./DB_Interactions.md:584: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:81:      await DB.feed.deleteOne({ server: msg.guild.id, url: toDelete.url });
 - ./DB_Interactions.md:585: - z:/POLLUX/POLARIS/DEV/bot/core/commands/utility/ytalert.js:100:    await DB.feed.set({ server: msg.guild.id }, { $set: { defaultChannel: channel } });
 - ./DB_Interactions.md:586: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/istranslator.js:4:  await DB.users.set(Target.id, { $set: { "switches.role": "translator", "switches.translator": args[0].toUpperCase() } });
 - ./DB_Interactions.md:587: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/primerollout.js:43:        let res = await DB.cosmetics.updateOne({ id: composeStickerName() }, { $set: { name: newName || thisSticker.name, public: true } }).catch(err => null);
 - ./DB_Interactions.md:588: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/primerollout.js:56:            DB.users.updateMany({ "prime.active": true }, { "prime.active": false }),
 - ./DB_Interactions.md:589: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botOwner/primerollout.js:57:            DB.users.updateMany({ "donator": { $exists: true } }, { "donator": null }),
 - ./DB_Interactions.md:590: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/fanartApprove.js:13:        return DB.fanart.updateOne({ hash }, { $set: { publish: false, 'extras.rank': 99 } })
 - ./DB_Interactions.md:591: - z:/POLLUX/POLARIS/DEV/bot/core/commands/_botStaff/fanartApprove.js:17:    await DB.fanart.updateOne({ hash }, { $set: { publish: true, 'extras.rank': 1 } })
 - ./DB_Interactions.md:592: - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:134:      DB.users.new(m.author).catch((err) => null);
 - ./DB_Interactions.md:593: - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:176:    if (!knownError) await DB.globals.updateOne({code: errorCode},{ $set:{ known: false , type: "errorCode"},$inc:{ocurrences: 1} });
 - ./DB_Interactions.md:594: - z:/POLLUX/POLARIS/DEV/bot/core/structures/CommandPreprocessor.js:177:    else await DB.globals.updateOne({code: errorCode}, { $inc:{ocurrences: 1} });
 - ./DB_Interactions.md:595: - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:52:        await DB.users.set(user.id, {
 - ./DB_Interactions.md:596: - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:65:      await DB.users.set(user.id, {
 - ./DB_Interactions.md:597: - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:72:    await DB.users.set(user.id, {
 - ./DB_Interactions.md:598: - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:157:    DB.users.set(Author.id, {
 - ./DB_Interactions.md:599: - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:165:      await DB.users.set(Author.id, {
 - ./DB_Interactions.md:600: - z:/POLLUX/POLARIS/DEV/bot/core/structures/TimedUsage.js:169:      await DB.users.set(Author.id, {
 - ./DB_Interactions.md:601: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:123:    await DB.users.updateOne(
 - ./DB_Interactions.md:602: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:206:    await DB.userInventory.updateOne(
 - ./DB_Interactions.md:603: - z:/POLLUX/POLARIS/DEV/bot/core/structures/_legacy_userdb_shim.js:365:    await DB._legacyUserDB.updateOne(
 - ./DB_Interactions.md:604: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:129:      return DB.users.set(trigger.author.id, { $inc: { "progression.exp": -10 } });
 - ./DB_Interactions.md:605: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:341:        DB.users.set({ id: { $in: ids } }, { $inc: { "progression.exp": 100 } }),
 - ./DB_Interactions.md:606: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:342:        DB.users.set(luckyOne.id, { $inc: { "progression.exp": 500 } }),
 - ./DB_Interactions.md:607: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:343:        DB.control.set(
 - ./DB_Interactions.md:608: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/boxDrops.js:351:        DB.control.set({ id: { $in: ids } }, { $inc: { "data.boxesLost": 1 } }),
 - ./DB_Interactions.md:609: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:44:		await DB.feed.updateOne(
 - ./DB_Interactions.md:610: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:69:					await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
 - ./DB_Interactions.md:611: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:72:					await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
 - ./DB_Interactions.md:612: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:92:				await DB.feed.remove( { server: feed.server, url: feed.url } ).catch(console.error);
 - ./DB_Interactions.md:613: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/rss.js:94:				await DB.feed.updateOne({ server: feed.server, url: feed.url },{ $inc: { erroredCount: 1} },).catch(console.error);
 - ./DB_Interactions.md:614: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/twitch.js:65:    await DB.feed.updateOne(
 - ./DB_Interactions.md:615: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/feeds/youtube.js:39:    await DB.feed.updateOne(
 - ./DB_Interactions.md:616: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/globalLevelUp.js:35:const commitLevel = (U,L) => DB.users.set(U, { $set: { "progression.level": L } });
 - ./DB_Interactions.md:617: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:22:	if (!LOCAL_RANK) return DB.localranks.new({ U: userID, S: serverID, level: 0, exp: 0 });
 - ./DB_Interactions.md:618: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:37:		await DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
 - ./DB_Interactions.md:619: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/localLevelUp.js:52:		DB.localranks.set({ user: userID, server: serverID }, { $set: { level: currentCalculatedLevel } });
 - ./DB_Interactions.md:620: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/microtasks/serverCache.js:20:        if (!sv.cluster) DB.servers.set({ id: sv.id }, { cluster: PLX.cluster.id });
 - ./DB_Interactions.md:621: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:5:    DB.users.updateMeta(msg.author);
 - ./DB_Interactions.md:622: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:6:    if (msg.guild) DB.serverDB.updateMeta(msg.guild);
 - ./DB_Interactions.md:623: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:22:    return DB.users.updateOne({ id: usID }, { $inc: { "progression.exp": EXP } }, { upsert: false }).lean().exec();
 - ./DB_Interactions.md:624: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:29:      DB.globalDB.set({
 - ./DB_Interactions.md:625: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:35:      DB.control.set(message.author.id, {
 - ./DB_Interactions.md:626: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/onEveryCommand.js:45:          return DB.control.set(message.guild.id, {
 - ./DB_Interactions.md:627: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/updateGuildSettings.js:10:        || await JSON.parse( (await PLX.redis.aget(`${DB.raw.db.databaseName}.serverdb.findOne.{"id":"${thisServer.id}"}`))||"null" )
 - ./DB_Interactions.md:628: - z:/POLLUX/POLARIS/DEV/bot/core/subroutines/updateGuildSettings.js:11:        || await DB.servers.findOne({id:thisServer.id}).cache();
 - ./DB_Interactions.md:629: - z:/POLLUX/POLARIS/DEV/bot/core/utilities/_Gearbox.bak:46:    DB.users.new(user.user||user);
 - ./DB_Interactions.md:630: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:41:core/archetypes/Progression.js: ... DB.users.findOne ... DB.users.updateOne ... DB.quests.find ...
 - ./DB_Interactions.md:631: - z:/POLLUX/POLARIS/DEV/bot/DB_Interactions.md:42:core/archetypes/Redeem.js: ... DB.promocodes.findOne/updateOne ... DB.users.getFull ... DB.cosmetics.get ... DB.audits.new ...
 - ./DB_Interactions.md:632: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildCreate.js:5:        if (!sv) await DB.servers.new(guild);
 - ./DB_Interactions.md:633: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildCreate.js:6:        await DB.servers.set(guild.id,{$addToSet: {activeClients:PLX.user.id} });
 - ./DB_Interactions.md:634: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/guildDelete.js:4:    DB.servers.set(guild.id,{$pull: {activeClients:PLX.user.id} });
 - ./DB_Interactions.md:635: - z:/POLLUX/POLARIS/DEV/bot/eventHandlers/interactions/booruSave.js:10:    let res = await DB.usercols.updateOne({ id: interaction.userID }, { $addToSet: { "collections.boorusave": save } }, { upsert: true });
 - ./DB_Interactions.md:636: - z:/POLLUX/POLARIS/DEV/bot/resources/items/streakfix+.js:21:      await DB.users.set(userData.id, { [`counters.${TARGET}.streak`]: destinationCounter.highest });
 - ./DB_Interactions.md:637: - z:/POLLUX/POLARIS/DEV/bot/resources/items/streakfix+.js:22:      await (await DB.userInventory.getFull(userData.id)).removeItem("streakfix+", 1);
 - ./DB_Interactions.md:638: - z:/POLLUX/POLARIS/DEV/bot/resources/items/streakfix.js:21:      await ( await DB.userInventory.getFull(userData.id) ).removeItem("streakfix", 1);
 - ./DB_Interactions.md:639: - z:/POLLUX/POLARIS/DEV/bot/resources/items/streakfix.js:22:      await DB.users.set(userData.id, { [`counters.${TARGET}.streak`]: destinationCounter.lastStreak });
 - ./DB_Interactions.md:640: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:86:  DB.temproles.find({ expires: { $lte: Date.now() + 75e3 } }).lean().exec()
 - ./DB_Interactions.md:641: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:99:                await DB.temproles.remove({ _id: tprl._id });
 - ./DB_Interactions.md:642: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:103:              await DB.temproles.expire({ U: tprl.user, S: tprl.server });
 - ./DB_Interactions.md:643: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:132:  DB.mutes.find({ expires: { $lte: Date.now() + 75e3 } })
 - ./DB_Interactions.md:644: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:142:                // DB.mutes.expire(Date.now());
 - ./DB_Interactions.md:645: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:199:  DB.feed.find({ expires: { $lte: Date.now() + 45e3 } }).limit(50).lean()
 - ./DB_Interactions.md:646: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:212:              await DB.feed.deleteOne({ _id: rem._id });
 - ./DB_Interactions.md:647: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:224:              await DB.feed.updateOne({ _id: rem._id }, { $inc: { failed: 1 } });
 - ./DB_Interactions.md:648: - z:/POLLUX/POLARIS/DEV/bot/sidecar.js:226:              await DB.feed.deleteOne({ _id: rem._id });
 - ./DB_Interactions.md:649: - z:/POLLUX/POLARIS/DEV/bot/startup/auxiliarySideFunctions.js:8:        if (!udata) udata = await DB.users.new(user);
 - ./DB_Interactions.md:650: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:166:      DB.users.bulkWrite.mockResolvedValue({});
 - ./DB_Interactions.md:651: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:167:      DB.audits.collection.insertMany.mockResolvedValue({});
 - ./DB_Interactions.md:652: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:173:      expect(DB.users.bulkWrite).toHaveBeenCalledTimes(1);
 - ./DB_Interactions.md:653: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:174:      expect(DB.audits.collection.insertMany).toHaveBeenCalledTimes(1);
 - ./DB_Interactions.md:654: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:217:      DB.users.bulkWrite.mockResolvedValue({});
 - ./DB_Interactions.md:655: - z:/POLLUX/POLARIS/DEV/bot/test/archetypes/Economy.test.js:218:      DB.audits.collection.insertMany.mockResolvedValue({});
 - ./eventHandlers/guildCreate.js:5:        if (!sv) await DB.servers.new(guild);
 - ./eventHandlers/guildCreate.js:6:        await DB.servers.set(guild.id,{$addToSet: {activeClients:PLX.user.id} });
 - ./eventHandlers/guildDelete.js:4:    DB.servers.set(guild.id,{$pull: {activeClients:PLX.user.id} });
 - ./eventHandlers/interactions/booruSave.js:10:    let res = await DB.usercols.updateOne({ id: interaction.userID }, { $addToSet: { "collections.boorusave": save } }, { upsert: true });
 - ./resources/items/streakfix+.js:21:      await DB.users.set(userData.id, { [`counters.${TARGET}.streak`]: destinationCounter.highest });
 - ./resources/items/streakfix+.js:22:      await (await DB.userInventory.getFull(userData.id)).removeItem("streakfix+", 1);
 - ./resources/items/streakfix.js:21:      await ( await DB.userInventory.getFull(userData.id) ).removeItem("streakfix", 1);
 - ./resources/items/streakfix.js:22:      await DB.users.set(userData.id, { [`counters.${TARGET}.streak`]: destinationCounter.lastStreak });
 - ./sidecar.js:86:  DB.temproles.find({ expires: { $lte: Date.now() + 75e3 } }).lean().exec()
 - ./sidecar.js:99:                await DB.temproles.remove({ _id: tprl._id });
 - ./sidecar.js:103:              await DB.temproles.expire({ U: tprl.user, S: tprl.server });
 - ./sidecar.js:132:  DB.mutes.find({ expires: { $lte: Date.now() + 75e3 } })
 - ./sidecar.js:142:                // DB.mutes.expire(Date.now());
 - ./sidecar.js:199:  DB.feed.find({ expires: { $lte: Date.now() + 45e3 } }).limit(50).lean()
 - ./sidecar.js:212:              await DB.feed.deleteOne({ _id: rem._id });
 - ./sidecar.js:224:              await DB.feed.updateOne({ _id: rem._id }, { $inc: { failed: 1 } });
 - ./sidecar.js:226:              await DB.feed.deleteOne({ _id: rem._id });
 - ./startup/auxiliarySideFunctions.js:8:        if (!udata) udata = await DB.users.new(user);
 - ./test/archetypes/Economy.test.js:166:      DB.users.bulkWrite.mockResolvedValue({});
 - ./test/archetypes/Economy.test.js:167:      DB.audits.collection.insertMany.mockResolvedValue({});
 - ./test/archetypes/Economy.test.js:173:      expect(DB.users.bulkWrite).toHaveBeenCalledTimes(1);
 - ./test/archetypes/Economy.test.js:174:      expect(DB.audits.collection.insertMany).toHaveBeenCalledTimes(1);
 - ./test/archetypes/Economy.test.js:217:      DB.users.bulkWrite.mockResolvedValue({});
 - ./test/archetypes/Economy.test.js:218:      DB.audits.collection.insertMany.mockResolvedValue({});

---

## Per‑query analysis examples

Below is an example of the kind of detailed, human‑readable analysis we expect for each database call found in the codebase.  The example is taken from `core/archetypes/UserProfileModel.js` around the `localranks` queries.

### User Profile Model

`\core\archetypes\UserProfileModel.js`

#### **Reads**

| **Operations** | Used for | Overload | Remarks | API endpoints to create |
|---------------|----------|----------|---------|-------------------------|
| • `DB.localranks.get({ user: this.ID, server: this.server })` <br>• `DB.localranks.find({ server: this.server, exp: { $gt: svRankData?.exp || 0 } }).countDocuments()` | to populate `thx` and `localRank` fields in the profile card | 2 | first call fetches the current user's rank entry (for `thx` count); second call computes how many users in the same server have more experience, which requires an aggregation/`countDocuments`. High‑traffic endpoints should be cached or combined into a single aggregation pipeline to avoid two round‑trips. | • **R1** `GET /localranks/:server/:user` → returns `{ thx, exp, rank }` where `rank` is calculated server‑side; optionally include `countGreater` to avoid second query. |

*(Repeat the table pattern for each unique query as you audit other files.)*

### ./core/archetypes/Achievements.js

- **Line 4** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Achievements.js

- **Line 15** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Achievements.js

- **Line 18** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Achievements.js

- **Line 24** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Achievements.js

- **Line 30** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Achievements.js

- **Line 33** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Achievements.js

- **Line 59** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Achievements.js

- **Line 62** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Achievements.js

- **Line 137** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Achievements.js

- **Line 141** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Airline.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Airline.js

- **Line 11** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Airline.js

- **Line 14** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Airline.js

- **Line 16** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Airline.js

- **Line 26** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Airline.js

- **Line 30** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Airline.js

- **Line 35** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Airline.js

- **Line 39** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Airline.js

- **Line 43** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Crafter.js

- **Line 12** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Crafter.js

- **Line 94** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Crafter.js

- **Line 95** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Crafter.js

- **Line 96** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Crafter.js

- **Line 290** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Crafter.js

- **Line 291** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Crafter.js

- **Line 299** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Crafter.js

- **Line 477** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Economy.js

- **Line 205** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Economy.js

- **Line 390** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Economy.js

- **Line 391** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Economy.js

- **Line 400** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Economy.js

- **Line 415** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Inventory.js

- **Line 10** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Inventory.js

- **Line 14** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 312** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 314** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 391** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 458** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 459** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 477** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 483** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 484** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 486** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 487** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 514** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 648** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 654** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 656** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 658** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Premium.js

- **Line 711** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 102** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 125** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 127** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 136** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 141** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 146** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 168** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 172** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 191** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 195** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 202** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 210** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 211** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 217** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 218** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 222** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 223** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 230** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 232** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 300** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 301** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Progression.js

- **Line 309** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 11** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 16** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 19** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 45** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 160** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 162** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 169** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 180** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 186** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Redeem.js

- **Line 196** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Switch.js

- **Line 143** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Switch.js

- **Line 144** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Switch.js

- **Line 146** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Switch.js

- **Line 147** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Switch.js

- **Line 177** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Switch.js

- **Line 178** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Tarot.js

- **Line 113** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/UserProfileModel.js

- **Line 53** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/UserProfileModel.js

- **Line 63** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/UserProfileModel.js

- **Line 79** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/UserProfileModel.js

- **Line 81** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/UserProfileModel.js

- **Line 91** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Venture.js

- **Line 227** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Venture.js

- **Line 229** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Venture.js

- **Line 230** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/archetypes/Venture.js

- **Line 256** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/beta/debug.js

- **Line 16** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/beta/debug.js

- **Line 22** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/beta/debug.js

- **Line 28** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/beta/debug.js

- **Line 36** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/beta/debug.js

- **Line 46** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/beta/vdiff.js

- **Line 4** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/beta/vdiff.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/beta/vdiff.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/background.js

- **Line 12** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/background.js

- **Line 56** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/background.js

- **Line 57** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/background.js

- **Line 79** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/background.js

- **Line 86** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/background.js

- **Line 87** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/craft.js

- **Line 35** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/favcolor.js

- **Line 14** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/favcolor.js

- **Line 42** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/fragment.js

- **Line 22** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/fragment.js

- **Line 23** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/fragment.js

- **Line 29** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/fragment.js

- **Line 34** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/fragment.js

- **Line 39** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/fragment.js

- **Line 100** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/fragment.js

- **Line 101** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/fragment.js

- **Line 102** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/lootbox_generator.js

- **Line 72** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/lootbox_generator.js

- **Line 73** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/lootbox_generator.js

- **Line 76** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/lootbox_generator.js

- **Line 90** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/lootbox_generator.js

- **Line 138** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/lootbox_generator.js

- **Line 292** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/lootbox_generator.js

- **Line 294** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/medalinfo.js

- **Line 7** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/openbooster.js

- **Line 7** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/openbooster.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/openbooster.js

- **Line 9** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/openbooster.js

- **Line 10** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/openbooster.js

- **Line 45** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/synthesize/any.js

- **Line 4** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/synthesize/index.js

- **Line 20** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/synthesize/synthBg.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/synthesize/synthBg.js

- **Line 17** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/synthesize/synthBg.js

- **Line 18** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/synthesize/synthMedal.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/cosmetics/synthesize/synthMedal.js

- **Line 16** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/balance.js

- **Line 24** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/balance.js

- **Line 25** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/balance.js

- **Line 77** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/daily.js

- **Line 54** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/daily.js

- **Line 247** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/daily.js

- **Line 292** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/daily.js

- **Line 297** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/daily.js

- **Line 303** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/daily.js

- **Line 312** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/givebox.js

- **Line 19** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/givebox.js

- **Line 48** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/givebox.js

- **Line 49** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/givebox.js

- **Line 50** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/local$.js

- **Line 117** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/local$.js

- **Line 135** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/delete.js

- **Line 10** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/delete.js

- **Line 11** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/delete.js

- **Line 18** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/list.js

- **Line 74** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/list.js

- **Line 75** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/list.js

- **Line 84** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/post.js

- **Line 44** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/post.js

- **Line 45** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/post.js

- **Line 120** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/marketplace/post.js

- **Line 121** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/transfer.js

- **Line 18** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/economy/transfer.js

- **Line 19** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/fun/responses.js

- **Line 59** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/fun/responses.js

- **Line 84** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/fun/responses.js

- **Line 98** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/fun/responses.js

- **Line 120** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/fun/responses.js

- **Line 136** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/airline/new.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/airline/new.js

- **Line 7** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/airline/new.js

- **Line 40** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/airline/routes/new.js

- **Line 38** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/betflip.js

- **Line 10** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/blackjack.js

- **Line 259** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/blackjack.js

- **Line 260** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/blackjack.js

- **Line 266** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/blackjack.js

- **Line 272** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/blackjack.js

- **Line 284** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/blackjack.js

- **Line 581** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/guessflag.js

- **Line 48** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/hangmaid/index.js

- **Line 177** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/highscores/flags.js

- **Line 4** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/highscores/_generic.js

- **Line 4** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/games/highscores.js

- **Line 21** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/img/kiss.js

- **Line 49** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/img/kiss.js

- **Line 50** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/img/kiss.js

- **Line 60** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migfix.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migfix.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migfix.js

- **Line 16** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migfix.js

- **Line 33** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migfix.js

- **Line 34** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migfix.js

- **Line 66** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 39** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 40** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 138** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 166** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 167** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 168** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 181** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 182** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 184** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 194** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 209** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 256** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 275** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 278** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 286** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 287** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 301** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 308** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 318** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 327** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 337** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 377** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 378** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 402** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/migrate.js

- **Line 403** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/prime.js

- **Line 3** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/prime.js

- **Line 37** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/prime.js

- **Line 45** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/prime.js

- **Line 74** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/prime.js

- **Line 77** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/status.js

- **Line 71** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/transactionlookup.js

- **Line 7** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/transactionlookup.js

- **Line 25** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/transactionlookup.js

- **Line 26** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/infra/transactionlookup.js

- **Line 49** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/inventory/decks.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/inventory/decks.js

- **Line 9** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/inventory/inventory.js

- **Line 49** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/inventory/inventory.js

- **Line 53** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/inventory/inventory.js

- **Line 54** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/inventory/use.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/inventory/use.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/inventory/use.js

- **Line 17** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/activateprime.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/activateprime.js

- **Line 23** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/activateprime.js

- **Line 46** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/activateprime.js

- **Line 47** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/activateprime.js

- **Line 48** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/activateprime.js

- **Line 49** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/claimtokens.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/claimtokens.js

- **Line 9** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/claimtokens.js

- **Line 10** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/errandfix.js

- **Line 4** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/errandfix.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/inventmigrate.js

- **Line 3** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/inventmigrate.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/mrgt.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/mrgt.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/mrgt.js

- **Line 11** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/mrgt.js

- **Line 29** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/mrgt.js

- **Line 161** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/misc/mrgt.js

- **Line 180** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/ban.js

- **Line 14** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/clear.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/kick.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/lang.js

- **Line 10** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/lang.js

- **Line 14** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/lang.js

- **Line 24** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/mute.js

- **Line 17** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/mute.js

- **Line 19** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/mute.js

- **Line 20** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/mute.js

- **Line 119** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/mute.js

- **Line 214** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/paidroles.js

- **Line 15** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/paidroles.js

- **Line 20** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/paidroles.js

- **Line 29** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/paidroles.js

- **Line 52** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/purge.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/reactionroles.js

- **Line 13** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/reactionroles.js

- **Line 40** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/reactionroles.js

- **Line 75** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/reactionroles.js

- **Line 84** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/reactionroles.js

- **Line 89** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/moderation/reactionroles.js

- **Line 103** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/pollux/adventure.js

- **Line 123** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/pollux/adventure.js

- **Line 154** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/pollux/adventure.js

- **Line 158** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/pollux/adventure.js

- **Line 166** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/pollux/errands/forfeit.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/pollux/errands/forfeit.js

- **Line 16** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/pollux/errands/index.js

- **Line 43** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/pollux/rewards.js

- **Line 191** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/roleplay/attribute.js

- **Line 18** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/roleplay/attribute.js

- **Line 28** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/roleplay/attribute.js

- **Line 30** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/roleplay/attribute.js

- **Line 37** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/roleplay/attribute.js

- **Line 39** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/roleplay/attribute.js

- **Line 45** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/roleplay/attribute.js

- **Line 47** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/roleplay/attribute.js

- **Line 51** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/roleplay/roll.js

- **Line 28** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/buyrole.js

- **Line 4** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/buyrole.js

- **Line 15** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/buyrole.js

- **Line 27** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/commend.js

- **Line 14** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/commend.js

- **Line 15** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/commend.js

- **Line 17** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/commend.js

- **Line 68** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/commend.js

- **Line 130** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/commend.js

- **Line 136** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/divorce.js

- **Line 4** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/divorce.js

- **Line 31** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/divorce.js

- **Line 91** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/divorce.js

- **Line 92** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/divorce.js

- **Line 164** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/divorce.js

- **Line 232** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/editprofile.js

- **Line 33** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/give.js

- **Line 2** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/give.js

- **Line 22** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/inventory.js

- **Line 2** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/open.js

- **Line 4** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/open.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/open.js

- **Line 12** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/open.js

- **Line 51** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/open.js

- **Line 55** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/peek.js

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/peek.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/wrap.js

- **Line 26** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/wrap.js

- **Line 182** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/gift/wrap.js

- **Line 183** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/leaderboards.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/leaderboards.js

- **Line 13** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/leaderboards.js

- **Line 15** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/leaderboards.js

- **Line 38** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/leaderboards.js

- **Line 40** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/leaderboards.js

- **Line 41** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/leaderboards.js

- **Line 46** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/leaderboards.js

- **Line 47** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/level.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/level.js

- **Line 7** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/level.js

- **Line 48** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/level.js

- **Line 49** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/level.js

- **Line 51** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/level.js

- **Line 58** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/level.js

- **Line 59** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/level.js

- **Line 73** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/level.js

- **Line 74** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 24** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 39** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 40** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 44** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 155** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 210** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 260** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 267** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 331** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 348** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 410** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 411** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 415** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 458** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 462** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 480** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 507** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 510** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 514** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 515** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 518** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 522** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/marry.js

- **Line 569** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/personaltext.js

- **Line 7** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/personaltext.js

- **Line 10** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/profile-v1.js

- **Line 138** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/profile-v1.js

- **Line 142** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/profile-v1.js

- **Line 150** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/profile-v1.js

- **Line 170** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/profile.js

- **Line 154** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/profile.js

- **Line 158** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/profile.js

- **Line 167** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/profile.js

- **Line 191** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/profilelink.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/rank.js

- **Line 11** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/rank.js

- **Line 12** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/rank.js

- **Line 13** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/rank.js

- **Line 72** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/roleme.js

- **Line 2** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/tagline.js

- **Line 7** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/tagline.js

- **Line 10** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/thanks.js

- **Line 16** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/thanks.js

- **Line 17** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/thanks.js

- **Line 80** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/thanks.js

- **Line 97** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/top.js

- **Line 17** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/top.js

- **Line 20** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/top.js

- **Line 23** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/top.js

- **Line 24** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/top.js

- **Line 25** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/top.js

- **Line 26** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/social/top.js

- **Line 98** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/chdeck.js

- **Line 5** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/chdeck.js

- **Line 11** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/chdeck.js

- **Line 17** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/pin.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/reminder.js

- **Line 21** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/reminder.js

- **Line 48** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/reminder.js

- **Line 94** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/rss.js

- **Line 11** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/rss.js

- **Line 31** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/rss.js

- **Line 39** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/rss.js

- **Line 65** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/rss.js

- **Line 66** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/rss.js

- **Line 85** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/say.js

- **Line 10** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/say.js

- **Line 59** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/saytochannel.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/tag.js

- **Line 7** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/tag.js

- **Line 63** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/tag.js

- **Line 66** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/tag.js

- **Line 81** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/tag.js

- **Line 115** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/tag.js

- **Line 129** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/tag.js

- **Line 153** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/tag.js

- **Line 169** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/twitchalert.js

- **Line 32** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/twitchalert.js

- **Line 69** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/weather.js

- **Line 36** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/ytalert.js

- **Line 18** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/ytalert.js

- **Line 43** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/ytalert.js

- **Line 51** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/ytalert.js

- **Line 80** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/ytalert.js

- **Line 81** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/utility/ytalert.js

- **Line 100** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botOwner/istranslator.js

- **Line 4** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botOwner/primerollout.js

- **Line 10** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botOwner/primerollout.js

- **Line 43** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botOwner/primerollout.js

- **Line 56** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botOwner/primerollout.js

- **Line 57** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botStaff/eval.js

- **Line 9** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botStaff/eval.js

- **Line 10** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botStaff/eval.js

- **Line 11** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botStaff/eval.js

- **Line 12** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botStaff/fanartApprove.js

- **Line 6** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botStaff/fanartApprove.js

- **Line 13** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botStaff/fanartApprove.js

- **Line 17** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/commands/_botStaff/lvup.js

- **Line 36** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/CommandPreprocessor.js

- **Line 125** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/CommandPreprocessor.js

- **Line 134** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/CommandPreprocessor.js

- **Line 175** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/CommandPreprocessor.js

- **Line 176** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/CommandPreprocessor.js

- **Line 177** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/Premium.js

- **Line 8** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/TimedUsage.js

- **Line 24** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/TimedUsage.js

- **Line 52** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/TimedUsage.js

- **Line 65** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/TimedUsage.js

- **Line 72** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/TimedUsage.js

- **Line 157** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/TimedUsage.js

- **Line 165** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/TimedUsage.js

- **Line 169** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 13** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 16** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 55** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 65** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 71** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 96** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 104** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 114** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 123** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 132** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 138** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 146** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 152** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 190** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 198** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 206** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 214** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 220** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 228** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 233** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/structures/_legacy_userdb_shim.js

- **Line 365** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/boxDrops.js

- **Line 79** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/boxDrops.js

- **Line 129** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/boxDrops.js

- **Line 335** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/boxDrops.js

- **Line 341** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/boxDrops.js

- **Line 342** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/boxDrops.js

- **Line 343** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/boxDrops.js

- **Line 351** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/customResponses.js

- **Line 15** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/feeds/index.js

- **Line 18** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/feeds/index.js

- **Line 20** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/feeds/rss.js

- **Line 44** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/feeds/rss.js

- **Line 69** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/feeds/rss.js

- **Line 72** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/feeds/rss.js

- **Line 92** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/feeds/rss.js

- **Line 94** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/feeds/twitch.js

- **Line 65** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/feeds/youtube.js

- **Line 39** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/globalLevelUp.js

- **Line 35** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/globalLevelUp.js

- **Line 41** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/localLevelUp.js

- **Line 3** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/localLevelUp.js

- **Line 22** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/localLevelUp.js

- **Line 29** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/localLevelUp.js

- **Line 37** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/localLevelUp.js

- **Line 52** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/microtasks/serverCache.js

- **Line 13** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/microtasks/serverCache.js

- **Line 20** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/microtasks/serverCache.js

- **Line 44** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/onEveryCommand.js

- **Line 5** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/onEveryCommand.js

- **Line 6** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/onEveryCommand.js

- **Line 22** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/onEveryCommand.js

- **Line 29** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/onEveryCommand.js

- **Line 35** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/onEveryCommand.js

- **Line 45** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/onEveryMessage.js

- **Line 26** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/updateGuildSettings.js

- **Line 10** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/subroutines/updateGuildSettings.js

- **Line 11** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/utilities/Gearbox/client.js

- **Line 14** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/utilities/Gearbox/client.js

- **Line 37** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/utilities/Premium.js

- **Line 21** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./core/utilities/_Gearbox.bak

- **Line 46** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 5** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 24** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 40** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 41** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 42** (Write) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 43** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 44** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 45** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 46** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 47** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 51** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 55** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 68** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 75** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 76** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 77** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 78** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 79** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 80** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 81** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 82** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 83** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 84** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 85** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 86** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 87** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 88** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 89** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 90** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 91** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 92** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 93** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 94** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 95** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 96** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 97** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 98** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 99** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 100** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 101** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 102** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 103** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 104** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 105** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 106** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 107** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 108** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 109** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 110** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 111** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 112** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 113** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 114** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 115** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 116** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 117** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 118** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 119** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 120** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 121** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 122** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 123** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 124** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 125** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 126** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 127** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 128** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 129** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 130** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 131** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 132** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 133** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 134** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 135** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 136** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 137** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 138** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 139** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 140** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 141** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 142** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 143** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 144** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 145** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 146** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 147** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 148** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 149** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

### ./DB_Interactions.md

- **Line 150** (Read) – 
  
  **Used for:** (describe purpose)
  **Remarks:** (add optimization notes)
  **Suggested endpoint:** (e.g. GET/POST /...)

