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

// {id,timemin,timemax,odds,event,landscape, condition, cosmo, rubines,sapphires,jades,lootbox,special}

const TIME_SLICE = 30;

module.exports = {
  Venture: class Venture {
    constructor(player, time, landscape) {
      Object.assign(this, { player: player.id, time, landscape });
      this.start = Date.now();
      this.end = Date.now() + time * 60 * 60 * 1000;
      this.insurance = (player.supplied_rubines || 223);
      this.pay = {};
      this.prize = {};
      this.journey = [];
      this.supply = {
        item: new Object(player.modules.inventory),
        rubines: this.insurance,
        jades: player.modules.jades,
        rubines_bank: player.modules.rubines,
        sapphires: player.modules.sapphires,
      };

      const event_count = Math.round((time * 60) / TIME_SLICE);
      let ev_i = 0;
      while (ev_i++ < event_count) {
        const eligible_events = VENTURE_EVENTS.filter((ev) => (ev.timemax >= (ev_i * 60) && ev.timemin <= (ev_i * 60))
                && (ev.onetime ? !stack.includes(ev.id) : true)
                && (ev.landscape ? ev.landscape === this.landscape : true));
        const odds = eligible_events.map((ev) => ev.odds);
        const IX = weightedRand(odds);
        const thisEvent = eligible_events[IX];
        eventProcessor(thisEvent, this);
        this.journey.push(thisEvent.id);
      }
    }
  },

  Journey: class Journey {
    constructor(Venture) {
      Venture = new Object(Venture);

      this.events = VENTURE_EVENTS.filter((VE) => Venture.journey.includes(VE.id));
      this.log = Venture.journey.map((ev) => this.events.map((e) => e.id).indexOf(ev));

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
};

function concatenateSpoils(source, key) {
  const spoil = [];
  const loss = [];

  if (["rubines", "sapphires", "jades", "cosmo"].includes(key)) {
    source[key] > 0 ? spoil.push({ type: key, amt: source[key] }) : loss.push({ type: key, amt: source[key] });
  }
  if (["item", "lootbox", "special"].includes(key)) {
    source[key] ? spoil.push({ type: key, item: source[key], amt: 1 }) : null;
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

    if (Criteria == "rubines" && supply.rubines >= Items) (res = true) && (payQuery.rubines = Items);

    else if (Criteria == "item" && supply.item.find((i) => i.id == Items && i.count > 0)) (res = true) && (payQuery.item = Items);

    else if (Criteria == "level" && this.player.level >= Items) (res = true);

    else if (Criteria == "jades" && supply.jades >= Items) (res = true) && (payQuery.jades = Items);

    else if (Criteria == "items-or" && Items.split(",").some((itm) => supply.item.find((i) => i.id == itm && i.count > 0))) (res = true) && (payQuery.items = supply.item.find((x) => x == Items.split(",")));

    else if (Criteria == "items-all" && Items.split(",").every((itm) => supply.item.find((i) => i.id == itm && i.count > 0))) (res = true) && (payQuery.items = Items.split(","));

    else if (Criteria == "sapphires" && supply.sapphires >= Items) (res = true) && (payQuery.sapphires = Items);

    else if (Criteria == "encounter" && journey.includes(Items)) (res = true);

    if (text.includes("|")) {
      if (!res) {
        const [pay, what] = event.fail.split(":");
        payQuery[pay] = -Number(what) || what;
        text = text.split("|")[1];
      } else {
        text = text.split("|")[0];
      }
    }
  }

  if (event.special == "wipe") prize = {};
  if (event.special == "wipeRBN") prize.rubines = {};
  if (event.special == "wipeBOX") prize.lootbox = {};

  for (i in payQuery) {
    if (typeof payQuery[i] === "number") {
      pay[i]
        ? pay[i] += payQuery[i]
        : pay[i] = payQuery[i];

      supply[i] -= payQuery[i];
    } else {
      supply[i].find((itm) => itm.id == payQuery[i]).count -= 1;
      pay[i] = pay[i] || {};
      if (pay[i]) {
        pay[i][payQuery[i]]
          ? pay[i][payQuery[i]]++
          : pay[i][payQuery[i]] = 1;
      }
    }
  }

  ["rubines", "sapphires", "jades", "cosmo"].forEach((gem) => (res && event[gem] ? prize[gem] = (prize[gem] || 0) + event[gem] : null));
  ["item", "lootbox", "special"].forEach((itm) => {
    res && event[itm] ? (prize[itm] || (prize[itm] = {}))[event[itm]] = (prize[itm][event[itm]] || 0) + 1 : null;
  });

  return { res, payQuery, text };
}
