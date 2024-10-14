const COOLDOWN_TIME = 2 * 60 * 60 * 1000;
module.exports = {
  config: {
    name: "guild",
    version: "2.0.0",
    author: "Hadi X Veng",
    cooldown: 10,
    role: 0,
    description: "buat guild mu dan main bareng teman mu dengan ikuti war guild",
    category: "game",
    guide: "{pn}",
  },
  onStart: async ({ api, event, message, usersData, threadsData, args }) => {
    const list = await usersData.get(botID);
    const guildData = list.data.guild || [];
    const senderID = event.senderID;
    const threadID = event.threadID;

    if (args[0] == "buat") {
      const guildName = args.slice(1).join(" ");
      const userdata = await usersData.get(senderID);
      const money = userdata.money;
      const exp = userdata.exp;
      const guildInfo = guildData.find(item => item.guildMember.includes(senderID));
      if (money < 600 || exp < 5000) {
        message.reply("Kamu tidak memiliki uang dan exp yang cukup untuk membuat guild.");
      } else {
        if (!guildInfo) {
      if (!guildName || guildName.length < 12) return message.reply("Masukkan nama guild dan nama harus 12 huruf.");
      const guildID = guildData.length + 1;
      const newGuild = {
        guildAdmin: senderID,
        guildID: guildID,
        guildName: guildName,
        guildMember: [senderID],
        guildMoney: 0,
        guildExp: 0,
        guildBases: []
      };
      guildData.push(newGuild);
      await usersData.set(botID, { ...list, data: { ...list.data, guild: guildData } });
      await usersData.set(senderID, {
          money: money - 600,
          exp: exp - 5000
        });
      return message.reply(`Guild "${guildName}" berhasil dibuat dengan ID: ${guildID}.`);
        } else {
          message.reply("Kamu sudah berada dalam guild keluar dari guild terlebih dahulu");
        }
      }
    }
    if (args[0] == "gabung") {
      const guildID = args[1];
      const guildInfo = guildData.find(item => item.guildID == guildID);
      if (!guildInfo) return message.reply("Guild tidak ditemukan.");
      if (guildInfo.guildMember.includes(senderID)) return message.reply("Kamu sudah bergabung di guild ini.");
      const guildIn = guildData.find(item => item.guildMember.includes(senderID));
      if (guildIn) return message.reply("Kamu sudah berada dalam guild");
      guildInfo.guildMember.push(senderID);
      await usersData.set(botID, { ...list, data: { ...list.data, guild: guildData } });
      return message.reply(`Berhasil bergabung di guild "${guildInfo.guildName}".`);
    }
    if (args[0] == "keluar") {
      const guildInfo = guildData.find(item => item.guildMember.includes(senderID));
      if (!guildInfo) return message.reply("Kamu tidak tergabung di guild manapun.");
      const memberIndex = guildInfo.guildMember.indexOf(senderID);
      if (memberIndex === -1) return message.reply("Kamu tidak tergabung di guild ini.");
      guildInfo.guildMember.splice(memberIndex, 1);
      await usersData.set(botID, { ...list, data: { ...list.data, guild: guildData } });
      message.reply(`Berhasil keluar dari guild "${guildInfo.guildName}".`);
    }
    if (args[0] == "info") {
      const guildInfo = guildData.find(item => item.guildMember.includes(senderID));
      if (!guildInfo) return message.reply("Kamu tidak tergabung di guild manapun.");
      const guildBasesInfo = guildInfo.guildBases.length > 0
        ? guildInfo.guildBases.map(base => `Base ID: ${base.baseID}, Total War History: ${base.warHistory.length}`).join("\n")
        : "Tidak ada base yang dimiliki.";
      const guildAdmin = guildInfo.guildAdmin;
      const guildName = guildInfo.guildName;
      const guildID = guildInfo.guildID;
      const guildMember = guildInfo.guildMember;
      const guildExp = guildInfo.guildExp;
      const totalExp = guildExp + 100;
      let guildlevel = Math.floor(totalExp / 100) || 1;
      message.reply(
        `Informasi Guild:\n` +
        `Nama: ${guildName} (ID: ${guildID})\n` +
        `Admin: ${await usersData.getName(guildAdmin)}\n` +
        `Guild Money: ${guildInfo.guildMoney}\n` +
        `Guild Exp: ${guildExp}\n` +
        `Guild Level: ${guildlevel}\n` +
        `Jumlah Anggota: ${await Promise.all(guildMember.map(async memberID => await usersData.getName(memberID))).then(names => names.join(", "))}\n` +
        `Base yang dimiliki:\n${guildBasesInfo}`
      );
    }
    if (args[0] == "list") {
      if (guildData.length === 0) return message.reply("Belum ada guild yang dibuat.");
      const guildInfoList = guildData.map( async (item, index) =>
        `${index + 1}: ${item.guildName} (ID: ${item.guildID})\nAdmin: ${await usersData.getName(item.guildAdmin)}`
      );
      return message.reply(`Daftar Guild:\n${guildInfoList.join("\n\n")}`);
    }
      if (args[0] == "kick") {
        const guildInfo = guildData.find(item => item.guildAdmin == senderID);
        if (!guildInfo) return message.reply("Kamu bukan admin guild atau tidak tergabung di guild manapun.");
        const memberID = args[1];
        const allUser = await usersData.getAll();
        const targetUser = Object.values(allUser).find(user => user.data.fakeID == memberID);
        const targetUserID = targetUser.userID;
        if (!memberID) return message.reply("Masukkan ID anggota yang ingin dikeluarkan.");
        const memberIndex = guildInfo.guildMember.indexOf(targetUserID);
        if (memberIndex === -1) return message.reply("Anggota tidak ditemukan di guild.");
        if (targetUserID == guildInfo.guildAdmin) return message.reply("Kamu tidak bisa menendang dirimu sendiri.");
        guildInfo.guildMember.splice(memberIndex, 1);
        await usersData.set(botID, { ...list, data: { ...list.data, guild: guildData } });
        return message.reply(`Anggota dengan nama ${await usersData.getName(memberID)} berhasil dikeluarkan dari guild "${guildInfo.guildName}".`);
      }
    if (args[0] == "c-base") {
      const guildInfo = guildData.find(item => item.guildAdmin == senderID);
      if (!guildInfo) return message.reply("Kamu bukan admin guild atau tidak tergabung di guild manapun.");
      const baseExists = guildData.some(item => item.guildBases.includes(threadID));
      if (baseExists) return message.reply("Base ini sudah dimiliki oleh guild lain.");
      guildInfo.guildBases.push({
        baseID: threadID,
        warHistory: []
      });
      await usersData.set(botID, { ...list, data: { ...list.data, guild: guildData } });
      return message.reply(`Base baru untuk guild "${guildInfo.guildName}" telah ditetapkan di thread ini.`);
    }
    if (args[0] == "war") {
      const attackingGuild = guildData.find(item => item.guildMember.includes(senderID));
      if (!attackingGuild) return message.reply("Kamu tidak tergabung dalam guild manapun.");
      const targetBaseID = args[1];
      const defendingGuild = guildData.find(item => item.guildBases.some(base => base.baseID == targetBaseID));
      if (!defendingGuild) return message.reply("Base yang kamu tuju tidak ditemukan atau tidak dimiliki guild lain.");
      const currentTime = Date.now();
      const lastWarTime = attackingGuild.lastWarTime || 0;
      if (currentTime - lastWarTime < COOLDOWN_TIME) {
        const remainingTime = COOLDOWN_TIME - (currentTime - lastWarTime);
        const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        message.reply(`Kamu harus menunggu ${remainingHours} jam ${remainingMinutes} menit sebelum bisa melakukan guild war lagi.`);
      }
      const defendingBase = defendingGuild.guildBases.find(base => base.baseID == targetBaseID);
      const attackingExp = attackingGuild.guildExp + attackingGuild.guildMember.length * 10;
      const defendingExp = defendingGuild.guildExp + defendingGuild.guildMember.length * 10;
      const totalExp = attackingExp + defendingExp;
      const attackingWinRate = attackingExp / totalExp;
      const warResult = Math.random() < attackingWinRate;
      if (warResult) {
        defendingGuild.guildBases = defendingGuild.guildBases.filter(base => base.baseID != targetBaseID);
        attackingGuild.guildBases.push({
          baseID: targetBaseID,
          warHistory: defendingBase.warHistory.concat({
            winner: attackingGuild.guildName,
            loser: defendingGuild.guildName,
            timestamp: new Date()
          })
        });
        const lootAmount = Math.floor(defendingGuild.guildMoney * 0.2);
        attackingGuild.guildMoney += lootAmount; 
        defendingGuild.guildMoney -= lootAmount; 
        attackingGuild.lastWarTime = Date.now();
        await usersData.set(botID, { ...list, data: { ...list.data, guild: guildData } });
        return message.reply(`Guild "${attackingGuild.guildName}" berhasil memenangkan war dan merebut base di "${targetBaseID}" dari guild "${defendingGuild.guildName}".\nKamu juga berhasil merampas ${lootAmount} uang dari guild yang kalah!`);
      } else {
        defendingBase.warHistory.push({
          winner: defendingGuild.guildName,
          loser: attackingGuild.guildName,
          timestamp: new Date()
        });
        attackingGuild.lastWarTime = Date.now();
        await usersData.set(botID, { ...list, data: { ...list.data, guild: guildData } });
        return message.reply(`Guild "${attackingGuild.guildName}" kalah dalam war dan gagal merebut base di "${targetBaseID}".`);
      }
    }
    if (args[0] == "help") return message.reply("Informasi fitur guild:\n\n" +
                                               "Buat guild: .guild buat <nama guild>\n" +
                                               "Gabung guild: .guild gabung <ID guild>\n" +
                                               "Keluar guild: .guild keluar\n" +
                                               "Info guild: .guild info\n" +
                                               "List guild: .guild list\n" +
                                               "Kick guild: .guild kick <ID anggota> (Hanya admin guild)\n" +
                                               "Tetapkan base guild: .guild c-base (Hanya admin guild)\n" +
                                               "War guild: .guild war <ID base> (Hanya admin guild)\n" +
                                               "Help guild: .guild help (list fitur)");
    if (args[0] == "bubarkan") {
      const guildInfo = guildData.find(item => item.guildAdmin == senderID);
      if (!guildInfo) return message.reply("Kamu tidak memiliki hak untuk membubarkan guild ini atau tidak tergabung di guild manapun.");
      const guildIndex = guildData.indexOf(guildInfo);
      guildData.splice(guildIndex, 1);
      await usersData.set(botID, { ...list, data: { ...list.data, guild: guildData } });
      return message.reply(`Guild "${guildInfo.guildName}" berhasil dibubarkan dan semua data terkait telah dihapus.`);
    }
    if (!args[0]) return message.reply("Keliatan nya kamu tidak mengerti cara menggunakan fitur ini nyaww~, ketik '.guild help' untuk menolong mu><");
  }
};
