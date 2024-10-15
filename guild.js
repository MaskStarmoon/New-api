module.exports = {
  config: {
    name: "nya",
    version: "1.4.5",
    author: "Saveng Fox",
    countDown: 5,
    role: 0,
    shortDescription: "nya.",
    longDescription: "nya.",
    category: "Chat Bot",
    guide: "{pn}"
  },
  onStart: async function({ api, event, args, message }) {
    api.sendMessage("nyaw.", event.threadID);
  },
  onChat: async function({ api, args, event, message, usersData }) {
    if (!event.body && event.body.toLowerCase()) {
      return;
    } else {
      const senderID = event.senderID;
      if (event.threadID === senderID) {
        return;
      }
      const userMoney = await usersData.get(senderID, "money");
      await usersData.set(senderID, { money: userMoney + 0.12 });
      const userExp = await usersData.get(senderID, "exp");
      await usersData.set(senderID, { exp: userExp + 0.12 });
      const list = await usersData.get(botID);
      const guildData = list.data.guild || [];
      const userGuild = guildData.find(guild => guild.guildMember.includes(senderID));
      if (!userGuild) return;
      userGuild.guildMoney += 0.15;
      userGuild.guildExp += 0.15;
      await usersData.set(botID, { ...list, data: { ...list.data, guild: guildData } });
      // const adminID = userGuild.guildAdmin;
      // api.sendMessage(
      //   `Guild "${userGuild.guildName}" mendapatkan tambahan 0.15 EXP dan Money dari member ${await usersData.getName(senderID)}.`,
      //   adminID
      // );
    }
  }
};
