const Picto = require("../utilities/Picto.js");

/* eslint max-classes-per-file: ["error", 2] */
const VENTURE_EVENTS = [
  {
    id: 1,
    timemin: 0,
    timemax: 1000,
    odds: 2,
    event: "test 1",
    item: "test",
    cosmo: 1,
    rubines: 2,
    sapphires: 3,
    lootbox: "SR",
  },
  {
    id: 2,
    timemin: 10,
    timemax: 4110,
    odds: 42,
    event: "test 2",
    condition: "rubines:111",
    item: "TTT",
    cosmo: 2,
    rubines: 3,
    sapphires: 4,
    lootbox: "C",
  },
  {
    id: 3,
    timemin: 0,
    timemax: 12200,
    odds: 5,
    event: "test 3",
    rubines: 12,
  },
  {
    id: 4,
    timemin: 0,
    timemax: 200,
    odds: 80,
    item: "wawa",
    condition: "item:rod_r",
    event: "test 4|test 4.2",
    landscape: "forest",
    fail: "rubines:-122",
    sapphires: 12,
  },
  {
    id: 5,
    timemin: 120,
    timemax: 20000,
    odds: 11,
    item: "sand",
    landscape: "desert",
    event: "test 6",
  },
];

function concatenateSpoils(source, key) {
  const spoil = [];
  const loss = [];

  if (["rubines", "sapphires", "jades", "cosmo"].includes(key)) {
    if (source[key] > 0) spoil.push({ type: key, amt: source[key] });
    else loss.push({ type: key, amt: source[key] });
  }
  if (["item", "lootbox", "special"].includes(key)) {
    if (source[key]) spoil.push({ type: key, item: source[key], amt: 1 });
  }
  return { spoil, loss };
}

function eventProcessor(event, Venture) {
  let {
    supply, journey, prize, pay,
  } = Venture;

  const payQuery = {};
  let res = true;
  let text = event.event;

  if (event.condition) {
    res = false;
    let [Criteria, Items] = event.condition.split(":");
    Items = Number(Items) || Items;

    switch (Criteria) {
      case "rubines": res = true; payQuery.rubines = Items; break;
      case "item" && supply.item.find((i) => i.id === Items && i.count > 0): res = true; payQuery.item = Items; break;
      case "level" && this.player.level >= Items: res = true; break;
      case "jades" && supply.jades >= Items: res = true; payQuery.jades = Items; break;
      case "items-or" && Items.split(",").some((itm) => supply.item.find((i) => i.id === itm && i.count > 0)):
        res = true; payQuery.items = supply.item.find((x) => x === Items.split(",")); break;
      case "items-all" && Items.split(",").every((itm) => supply.item.find((i) => i.id === itm && i.count > 0)):
        res = true; payQuery.items = Items.split(","); break;
      case "sapphires" && supply.sapphires >= Items: res = true; payQuery.sapphires = Items; break;
      case "encounter" && journey.includes(Items): res = true; break;
      default: throw new RangeError(`Unexpected input: ${Criteria}`);
    }

    if (text.includes("|")) {
      if (!res) {
        const [p, what] = event.fail.split(":");
        payQuery[p] = -Number(what) || what;
        [, text] = text.split("|");
      } else {
        [text] = text.split("|");
      }
    }
  }

  if (event.special === "wipe") prize = {};
  if (event.special === "wipeRBN") prize.rubines = {};
  if (event.special === "wipeBOX") prize.lootbox = {};

  for (i in payQuery) {
    if (typeof payQuery[i] === "number") {
      pay[i] = pay[i] ? (pay[i] + payQuery[i]) : payQuery[i];

      supply[i] -= payQuery[i];
    } else {
      supply[i].find((itm) => itm.id === payQuery[i]).count -= 1; // eslint-disable-line no-loop-func
      pay[i] = pay[i] || {};
      if (pay[i]) {
        pay[i][payQuery[i]] = pay[i][payQuery[i]] ? pay[i][payQuery[i]] += 1 : 1;
      }
    }
  }

  ["rubines", "sapphires", "jades", "cosmo"].forEach((gem) => (res && event[gem] ? (prize[gem] = (prize[gem] || 0) + event[gem]) : null));
  ["item", "lootbox", "special"].forEach(
    (itm) => (res && event[itm] ? ((prize[itm] || (prize[itm] = {}))[event[itm]] = (prize[itm][event[itm]] || 0) + 1) : null),
  );

  return { res, payQuery, text };
}

// {id,timemin,timemax,odds,event,landscape, condition, cosmo, rubines,sapphires,jades,lootbox,special}

const TIME_SLICE = 30;

module.exports = {
  Venture: class Venture {
    constructor(player, time, landscape, playersHere = []) {
      Object.assign(this, { player: player.id, time, landscape });
      this.start = Date.now();
      this.end = Date.now() + time * 60 * 60 * 1000;
      this.insurance = (player.supplied_rubines || 223);
      this.pay = {};
      this.prize = {};
      this.journey = [];
      this.supply = {
        item: { ...player.modules.inventory },
        rubines: this.insurance,
        jades: player.modules.JDE,
        rubines_bank: player.modules.RBN,
        sapphires: player.modules.SPH,
      };

      const eventCount = Math.round((time * 60) / TIME_SLICE);
      let evInt = 0;
      while ((evInt++) < eventCount) {
        const eligibleEvents = VENTURE_EVENTS.filter(
          (ev) => (ev.timemax >= (evInt * 60) && ev.timemin <= (evInt * 60)) // eslint-disable-line
                && (ev.onetime ? !this.journey.includes(ev.id) : true)
                && (ev.landscape ? ev.landscape === this.landscape : true),
        );
        const odds = eligibleEvents.map((ev) => ev.odds);
        const IX = weightedRand(odds);
        const thisEvent = eligibleEvents[IX];
        eventProcessor(thisEvent, this);

        const noise = randomize(0, 5);
        const time = i * TIME_SLICE + 5;

        this.journey.push({
          id: thisEvent.id,
          time: time - noise,
          trueTime: time,
          interactions: shuffle(playersHere)[0],
        });
      }
    }
  },

  Journey: class Journey {
    constructor(Venture) {
      Venture = { ...Venture };

      this.events = VENTURE_EVENTS.filter((VE) => Venture.journey.map((e) => e.id).includes(VE.id));
      this.log = Venture.journey.map((ev) => this.events.map((e) => e.id).indexOf(ev.id));

      this.journal = this.log.map((idx, i) => {
        const EVT = this.events[idx];
        const detail = eventProcessor(EVT, Venture);
        let losses = [];
        let spoils = [];

        Object.keys(EVT).forEach((ky) => {
          if (detail.res) {
            const { loss, spoil } = concatenateSpoils(EVT, ky);
            spoils = spoils.concat(spoil);
            losses = losses.concat(loss);
          }
        });

        Object.keys(detail.payQuery).forEach((ky) => {
          const { loss, spoil } = concatenateSpoils(detail.payQuery, ky);
          losses = losses.concat(spoil, loss);
        });

        return {
          text: detail.text, losses, spoils, moment: i + 1,
        };
      });
    }
  },
  async renderMap(location, msg) {
    const H = 500;
    const canvas = Picto.new(800, H);
    const ctx = canvas.getContext("2d");

    const LOC = await DB.advLocations.findOne({ id: location }).lean();
    console.log(LOC);
    const NEI = await DB.advLocations.traceRoutes(location, 0);
    const LOCS = await DB.advLocations.find({ id: { $in: NEI.map((x) => x._id) } }).lean();

    const coords = LOC.coordinates;
    console.log(LOCS);

    const bigMap = await Picto.getCanvas("https://cdn.discordapp.com/attachments/488142034776096772/773752670418501652/unknown.png");
    const overlay = await Picto.getCanvas("https://cdn.discordapp.com/attachments/488142034776096772/774058122729488384/frame.png");

    ctx.drawImage(bigMap, -coords.x + H / 2, -coords.y + H / 2);
    LOCS.forEach((loc) => {
      const thisCoords = loc.coordinates;

      ctx.beginPath();
      ctx.lineWidth = "5";
      ctx.strokeStyle = "#FFFA";
      ctx.setLineDash([5, 15]);
      ctx.lineCap = "round";
      ctx.fillStyle = "red";
      ctx.moveTo(H / 2, H / 2);
      ctx.lineTo(
        -coords.x + thisCoords.x + H / 2,
        -coords.y + thisCoords.y + H / 2,
      );
      ctx.stroke();
    });

    const playerCount = await DB.advJourneys.countDocuments({ location, end: { $gt: Date.now() } });

    ctx.fillStyle = playerCount ? "green" : "red";
    ctx.fillRect(265, 46, 30, 30);
    ctx.fillStyle = "yellow";
    ctx.fillRect(0, 0, 153, 32);

    ctx.drawImage(overlay, 0, 0);

    ctx.drawImage(Picto.tag(ctx, "Players Here", "12px Quicksand").item, 270, 25);
    ctx.drawImage(Picto.tag(ctx, playerCount, "12px Quicksand").item, 292, 50);

    Picto.popOutTxt(ctx, LOC.name, 89, 413, "900 italic 43px 'Panton Black'", "white", 770);

    msg.channel.send({
      embed: {

        title: `**${LOC.name}**`,
        description: `
     **Connects to:**
      ${LOCS.map((x) => `\`${x.id}\`${x.name}: (${cardinalDirection(coords, x.coordinates)}) `).join("\n")}
      `,
        image: { url: "attachment://map.png" },

      },
    },
    { file: await canvas.toBuffer(), name: "map.png" });
  },
};

function cardinalDirection(LocationA, LocationB) {
  console.log(LocationA);
  const dy = LocationB.y - LocationA.y;
  const dx = LocationB.x - LocationA.x;
  let θ  = Math.atan2(dy, dx) * 180 / Math.PI;

  console.log({
    LocationA, LocationB, dy, dx, θ,
  });

  if (θ < 0) θ = 360 + θ;

  if (θ < 23) return "E";
  if (θ >= 23 && θ < 68) return "SE";
  if (θ >= 68 && θ < 113) return "S";
  if (θ >= 113 && θ < 158) return "SW";
  if (θ >= 158 && θ < 203) return "W";
  if (θ >= 203 && θ < 248) return "NW";
  if (θ >= 248 && θ < 303) return "N";
  if (θ >= 248) return "NE";
}
