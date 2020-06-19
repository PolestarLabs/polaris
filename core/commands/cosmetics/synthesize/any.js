module.exports = {
  Template: async function Template(type, args, userData) {
    const target = args[1];
    let BASE = await DB.cosmetics.find({
      type,
      rarity: { $ne: "XR" },
      exclusive: { $exists: false },
      $or: [{ buyable: true }, { synth: true }],
    }).lean().exec();

    BASE = shuffle(BASE);

    selectedItem = BASE.find((item) => {
      if (!["c", "u", "r", "sr", "ur"].includes(target)) {
        if (item.id === target) return true;
        if (item.icon === target) return true;
        if (target.includes(item.icon)) return true;
        if (args.some((arg) => item.name.toLowerCase().includes(arg))) return true;
        if (args.some((arg) => (item.tags || "").toLowerCase().includes(arg))) return true;
      }
      if (item.rarity.toLowerCase() === target) return true;
      return false;
    });
    if (!selectedItem || target == "random") selectedItem = shuffle(BASE)[0];

    const payCoin = `cosmo_gem_${selectedItem.rarity}`;
    const canBuy = selectedItem.buyable && !selectedItem.event;
    const affordsIt = userData.modules.inventory.find((itm) => (itm.id == `cosmo_gem_${selectedItem.rarity}`) && itm.count >= 1) || false;
    const obtainable = selectedItem.buyable && !selectedItem.event;
    console.log({
      payCoin, canBuy, affordsIt, obtainable,
    }, 2);
    return {
      payCoin, canBuy, affordsIt, obtainable,
    };
  },

  SynthPrompt: function SynthPrompt(hasIt, embed, obtainable, affordsIt, P) {
    if (hasIt) {
      embed.footer($t("interface.generic.alreadyOwnThis", P));
    } else if (obtainable) {
      if (affordsIt) embed.footer($t("interface.synthfrag.confirmSynth", P));
      else embed.footer($t("interface.synthfrag.nogemsforThis", P));
    }
  },
};
