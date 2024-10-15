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
      const guildData = (await usersData.get(botID, "guild")).data.guild || [];
      const userGuild = guildData.find(guild => guild.guildMember.includes(senderID));
      //const adminID = userGuild.guildAdmin;
      if (!userGuild) return;
      const guildMoney = userGuild.guildMoney + 0.15;
      const guildExp = userGuild.guildExp + 0.15;
      await usersData.set(botID, { ...guildData, data: { guild: guildMoney: guildMoney, guildExp: guildExp } });
      //api.sendMessage(
       // `Guild "${userGuild.guildName}" mendapatkan tambahan 0.12 EXP dan Money dari member ${await usersData.getName(senderID)}.`,
        //adminID
      //);
    }
  }
};
