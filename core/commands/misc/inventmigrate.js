const init = async function (msg, args, silent) {
  const userData = await DB.users.get(msg.author.id);

  const oldInventory = userData.modules.inventory;
  const newInventory = [];

  oldInventory.forEach((item) => {
    const currItem = newInventory.find((sub) => sub.id === item);
    if (currItem) currItem.count++;
    else newInventory.push({ id: item, count: 1 });
  });

  if (!silent) return;
  return newInventory;
};

module.exports = {
  init,
  pub: false,
  cmd: "inventmigrate",
  perms: 3,
  cat: "misc",
  botPerms: ["attachFiles", "embedLinks"],
  aliases: [],
};
