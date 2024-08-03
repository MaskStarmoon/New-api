const fs = require('fs');
const path = require('path');

const guildFilePath = path.join('./guild.json');
const gmemberFilePath = path.join('./gmember.json');

if (!fs.existsSync(guildFilePath)) {
  fs.writeFileSync(guildFilePath, JSON.stringify({}));
}

if (!fs.existsSync(gmemberFilePath)) {
  fs.writeFileSync(gmemberFilePath, JSON.stringify({}));
}

module.exports = {
  config: {
    name: "guild",
    aliases: ['g'],
    version: "1.0",
    author: "Rizky", // modif doang bwang by I M Range
    role: 0,
    shortDescription: {
      en: "Manajemen guild"
    },
    longDescription: {
      en: "Buat dan kelola guild."
    },
    category: "games",
    guide: {
      en: "guild buat <namaGuild> - Membuat guild baru\nguild join <namaGuild> - Bergabung dengan guild\nguild keluar - Keluar dari guild\nguild pay <jumlahUang> - Mengirim uang ke guild\nguild tarik <jumlahUang> - Menarik uang dari guild (Hanya pembuat guild)\nguild lihat - Melihat jumlah uang di guild\nguild gm <halaman> - Melihat anggota guild\nguild rename <namaBaru> - Mengganti nama guild (Hanya pembuat guild)\nguild kick <fakeUid> - Menghapus anggota dari guild (Hanya pembuat guild)\nguild list - Melihat daftar guild yang tersedia\nguild top - Melihat top guild berdasarkan uang guild"
    }
  },

  onStart: async function ({ args, event, api, usersData, message }) {
    const query = args[0];
    const { senderID, threadID, isGroup } = event;

    if (senderID === api.getCurrentUserID()) return;

    const userData = await usersData.get(senderID);
    if (!userData) {
      return api.sendMessage("Data pengguna tidak ditemukan.", threadID);
    }

    let guildData = JSON.parse(fs.readFileSync(guildFilePath, 'utf8'));
    let gmemberData = JSON.parse(fs.readFileSync(gmemberFilePath, 'utf8'));

    const userGuild = Object.values(guildData).find(guild => guild.creator === senderID);

    if (query === "buat") {
      if (!isGroup) {
        return api.sendMessage("Perintah ini hanya bisa digunakan di dalam grup.", threadID);
      }

      const existingGuild = Object.values(guildData).find(guild => guild.threadID === threadID);
      if (existingGuild) {
        return api.sendMessage("Guild sudah ada di grup ini. Setiap grup hanya bisa memiliki satu guild.", threadID);
      }

      if (userGuild) {
        return api.sendMessage("Kamu sudah memiliki guild. Setiap pengguna hanya bisa membuat satu guild.", threadID);
      }

      const guildName = args[1];
      if (!guildName || guildName.includes(" ") || guildName.length < 4) {
        return api.sendMessage("Nama guild tidak valid. Nama guild harus tanpa spasi, menggunakan huruf besar, dan minimal 4 karakter.", threadID);
      }

      if (guildData[guildName]) {
        return api.sendMessage("Nama guild sudah ada. Pilih nama lain.", threadID);
      }

      if (userData.money < 1000) {
        return api.sendMessage("Uangmu tidak cukup untuk membuat guild, sobat.", threadID);
      }

      const guildID = Object.keys(guildData).length + 1;

      guildData[guildName] = {
        id: guildID,
        creator: senderID,
        members: [senderID],
        money: 0,
        threadID: threadID
      };

      userData.money -= 1000;
      await usersData.set(senderID, userData);
      fs.writeFileSync(guildFilePath, JSON.stringify(guildData, null, 2));

      gmemberData[guildName] = [senderID];
      fs.writeFileSync(gmemberFilePath, JSON.stringify(gmemberData, null, 2));

      return api.sendMessage(`Guild ${guildName} berhasil dibuat. Selamat, guildmu sudah siap!`, threadID);

    } else if (query === "join") {
      const guildName = args[1];
      if (!guildName) {
        return api.sendMessage("Masukkan nama guild yang ingin kamu ikuti, sobat.", threadID);
      }

      const guild = guildData[guildName];
      if (!guild) {
        return api.sendMessage("Guild tidak ditemukan, coba periksa lagi namanya ya.", threadID);
      }

      const currentGuild = Object.keys(guildData).find(gName => guildData[gName].members.includes(senderID));
      if (currentGuild) {
        return api.sendMessage(`Kamu sudah berada di guild ${currentGuild}. Kamu harus keluar dari guild tersebut sebelum bergabung dengan guild lain.`, threadID);
      }

      if (guild.members.includes(senderID)) {
        return api.sendMessage("Kamu sudah berada di guild ini.", threadID);
      }

      if (guild.threadID !== threadID) {
        try {
          await api.addUserToGroup(senderID, guild.threadID);
          guild.members.push(senderID);
          fs.writeFileSync(guildFilePath, JSON.stringify(guildData, null, 2));

          if (!gmemberData[guildName]) {
            gmemberData[guildName] = [];
          }
          gmemberData[guildName].push(senderID);
          fs.writeFileSync(gmemberFilePath, JSON.stringify(gmemberData, null, 2));

          return api.sendMessage(`Kamu berhasil bergabung ke guild ${guildName}. Selamat bergabung!`, threadID);
        } catch (error) {
          console.error(`Error adding user to group: ${error.message}`);
          return api.sendMessage("Terjadi kesalahan saat mengundang ke grup. Pastikan bot memiliki izin yang cukup.", threadID);
        }
      } else {
        guild.members.push(senderID);
        if (!gmemberData[guildName]) {
          gmemberData[guildName] = [];
        }
        gmemberData[guildName].push(senderID);
        fs.writeFileSync(guildFilePath, JSON.stringify(guildData, null, 2));
        fs.writeFileSync(gmemberFilePath, JSON.stringify(gmemberData, null, 2));

        return api.sendMessage(`Kamu berhasil bergabung ke guild ${guildName}. Selamat bergabung!`, threadID);
      }

    } else if (query === "keluar") {
      const userGuildName = Object.keys(guildData).find(guildName => guildData[guildName].members.includes(senderID));
      if (!userGuildName) {
        return api.sendMessage("Kamu belum bergabung ke guild manapun, sobat.", threadID);
      }

      const guild = guildData[userGuildName];
      if (guild.creator === senderID) {
        delete guildData[userGuildName];
        fs.writeFileSync(guildFilePath, JSON.stringify(guildData, null, 2));

        delete gmemberData[userGuildName];
        fs.writeFileSync(gmemberFilePath, JSON.stringify(gmemberData, null, 2));

        return api.sendMessage(`Guild ${userGuildName} telah dihapus karena pembuat guild keluar.`, threadID);
      } else {
        guild.members = guild.members.filter(member => member !== senderID);
        fs.writeFileSync(guildFilePath, JSON.stringify(guildData, null, 2));

        if (gmemberData[userGuildName]) {
          gmemberData[userGuildName] = gmemberData[userGuildName].filter(member => member !== senderID);
          fs.writeFileSync(gmemberFilePath, JSON.stringify(gmemberData, null, 2));
        }

        try {
          await api.sendMessage(`Kamu telah keluar dari guild ${userGuildName}.`, threadID);
        } catch (error) {
          console.error(`Error removing user from group: ${error.message}`);
          return api.sendMessage("Terjadi kesalahan saat mengeluarkan dari grup. Pastikan bot memiliki izin yang cukup.", threadID);
        }
      }

    } else if (query === "pay") {
      const amount = parseInt(args[1], 10);
      if (isNaN(amount) || amount <= 0) {
        return api.sendMessage("Masukkan jumlah uang yang valid untuk dikirim ke guild, sobat.", threadID);
      }

      const userGuildName = Object.keys(guildData).find(guildName => guildData[guildName].members.includes(senderID));
      if (!userGuildName) {
        return api.sendMessage("Kamu belum bergabung ke guild manapun, sobat.", threadID);
      }

      if (userData.money < amount) {
        return api.sendMessage("Uangmu tidak cukup untuk dikirim ke guild.", threadID);
      }

      const guild = guildData[userGuildName];
      guild.money += amount;
      userData.money -= amount;
      await usersData.set(senderID, userData);
      fs.writeFileSync(guildFilePath, JSON.stringify(guildData, null, 2));

      return api.sendMessage(`Uang sejumlah ${amount} berhasil dikirim ke guild ${userGuildName}. Terima kasih!`, threadID);

    } else if (query === "tarik") {
      const amount = parseInt(args[1], 10);
      if (isNaN(amount) || amount <= 0) {
        return api.sendMessage("Masukkan jumlah uang yang valid untuk ditarik dari guild, sobat.", threadID);
      }

      const userGuildName = Object.keys(guildData).find(guildName => guildData[guildName].members.includes(senderID));
      if (!userGuildName) {
        return api.sendMessage("Kamu belum bergabung ke guild manapun, sobat.", threadID);
      }

      const guild = guildData[userGuildName];
      if (guild.creator !== senderID) {
        return api.sendMessage("Hanya pembuat guild yang bisa menarik uang dari guild.", threadID);
      }

      if (guild.money < amount) {
        return api.sendMessage("Uang di guild tidak cukup untuk ditarik.", threadID);
      }

      guild.money -= amount;
      userData.money += amount;
      await usersData.set(senderID, userData);
      fs.writeFileSync(guildFilePath, JSON.stringify(guildData, null, 2));

      return api.sendMessage(`Uang sejumlah ${amount} berhasil ditarik dari guild ${userGuildName}.`, threadID);

    } else if (query === "lihat") {
      const userGuildName = Object.keys(guildData).find(guildName => guildData[guildName].members.includes(senderID));
      if (!userGuildName) {
        return api.sendMessage("Kamu belum bergabung ke guild manapun, sobat.", threadID);
      }

      const guild = guildData[userGuildName];
      return api.sendMessage(`Guild ${userGuildName} memiliki uang sejumlah ${guild.money}.`, threadID);

    } else if (query === "gm") {
      const userGuildName = Object.keys(guildData).find(guildName => guildData[guildName].members.includes(senderID));
      if (!userGuildName) {
        return api.sendMessage("Kamu belum bergabung ke guild manapun, sobat.", threadID);
      }

      const guild = guildData[userGuildName];
      const members = guild.members.map(member => usersData.get(member).then(user => user.name || `User ${member}`));

      const page = parseInt(args[1], 10) || 1;
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const totalPages = Math.ceil(members.length / pageSize);

      const memberList = (await Promise.all(members)).slice(startIndex, endIndex).join('\n');
      return api.sendMessage(`Anggota guild ${userGuildName} (Halaman ${page} dari ${totalPages}):\n${memberList}`, threadID);

    } else if (query === "rename") {
      if (!args[1] || args[1].includes(" ") || args[1].length < 4) {
        return api.sendMessage("Nama guild baru tidak valid. Nama guild harus tanpa spasi, menggunakan huruf besar, dan minimal 4 karakter.", threadID);
      }

      const userGuildName = Object.keys(guildData).find(guildName => guildData[guildName].members.includes(senderID));
      if (!userGuildName) {
        return api.sendMessage("Kamu belum bergabung ke guild manapun, sobat.", threadID);
      }

      const guild = guildData[userGuildName];
      if (guild.creator !== senderID) {
        return api.sendMessage("Hanya pembuat guild yang bisa mengganti nama guild.", threadID);
      }

      const newGuildName = args[1];
      if (guildData[newGuildName]) {
        return api.sendMessage("Nama guild baru sudah ada. Pilih nama lain.", threadID);
      }

      guildData[newGuildName] = guild;
      delete guildData[userGuildName];
      fs.writeFileSync(guildFilePath, JSON.stringify(guildData, null, 2));

      gmemberData[newGuildName] = gmemberData[userGuildName];
      delete gmemberData[userGuildName];
      fs.writeFileSync(gmemberFilePath, JSON.stringify(gmemberData, null, 2));

      return api.sendMessage(`Nama guild berhasil diganti menjadi ${newGuildName}.`, threadID);

    } else if (query === "kick") {
      const userGuildName = Object.keys(guildData).find(guildName => guildData[guildName].members.includes(senderID));
      if (!userGuildName) {
        return api.sendMessage("Kamu belum bergabung ke guild manapun, sobat.", threadID);
      }

      const guild = guildData[userGuildName];
      if (guild.creator !== senderID) {
        return api.sendMessage("Hanya pembuat guild yang bisa menghapus anggota dari guild.", threadID);
      }

      const fakeUid = args[1];
      if (!fakeUid || isNaN(fakeUid)) {
        return api.sendMessage("Masukkan ID palsu yang valid dari anggota yang ingin dihapus.", threadID);
      }

      const memberId = Object.keys(usersData).find(id => usersData[id].fakeUid == fakeUid);
      if (!memberId || !guild.members.includes(memberId)) {
        return api.sendMessage("Anggota tidak ditemukan dalam guild.", threadID);
      }

      guild.members = guild.members.filter(member => member !== memberId);
      fs.writeFileSync(guildFilePath, JSON.stringify(guildData, null, 2));

      if (gmemberData[userGuildName]) {
        gmemberData[userGuildName] = gmemberData[userGuildName].filter(member => member !== memberId);
        fs.writeFileSync(gmemberFilePath, JSON.stringify(gmemberData, null, 2));
      }

      try {
        await api.sendMessage(`Anggota dengan ID palsu ${fakeUid} berhasil dihapus dari guild.`, threadID);
      } catch (error) {
        console.error(`Error removing user from group: ${error.message}`);
        return api.sendMessage("Terjadi kesalahan saat mengeluarkan dari grup. Pastikan bot memiliki izin yang cukup.", threadID);
      }
    } else if (query === "list") {
        const guildNames = Object.keys(guildData);
           if (guildNames.length === 0) {
    return api.sendMessage("Tidak ada guild yang tersedia saat ini.", threadID);
  }

        const page = parseInt(args[1], 10) || 1;
        const pageSize = 8;
        const totalPages = Math.ceil(guildNames.length / pageSize);

           if (page < 1 || page > totalPages) {
    return api.sendMessage(`Halaman tidak valid. Total halaman: ${totalPages}`, threadID);
  }
            
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const guildsOnPage = guildNames.slice(startIndex, endIndex);

        let messageText = `📌List Guild\n(Halaman ${page}/${totalPages}):\n`;
            for (const guildName of guildsOnPage) {
        const guild = guildData[guildName];
    messageText += `${guildName || 'Tidak ada guild'} (ID: ${guild.id})\n`;
  }

    return api.sendMessage(messageText.trim(), threadID);
    } else if (query === "top") {
      const sortedGuilds = Object.entries(guildData)
    .sort((a, b) => b[1].money - a[1].money) // Urutkan guild berdasarkan uang
    .slice(0, 8); // Ambil 8 guild teratas

  if (sortedGuilds.length === 0) {
    return api.sendMessage("Tidak ada guild yang tersedia saat ini.", threadID);
  }

       const page = parseInt(args[1], 10) || 1;
       const pageSize = 8;
       const totalPages = Math.ceil(sortedGuilds.length / pageSize);

        if (page < 1 || page > totalPages) {
    return api.sendMessage(`Halaman tidak valid. Total halaman: ${totalPages}`, threadID);
  }

       const startIndex = (page - 1) * pageSize;
       const endIndex = startIndex + pageSize;
       const guildsOnPage = sortedGuilds.slice(startIndex, endIndex);
        let messageText = `🔝 Top Guilds (Halaman ${page}/${totalPages}):\n`;
  guildsOnPage.forEach(([guildName, guild]) => {
    messageText += `${guildName} (ID: ${guild.id}, Uang: ${guild.money})\n`;
  });

      return api.sendMessage(messageText.trim(), threadID);
}        

    return api.sendMessage(`Perintah yang kamu masukan tidak ada bwang^^. Gunakan\n\n${module.exports.config.guide.en}`, threadID);
  }
};

function loadUserData(userID) {
  const userDataPath = path.join(dataDir, `${userID}.json`);
  if (fs.existsSync(userDataPath)) {
    return JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
  }
  return null;
}

function saveUserData(userID, data) {
  const userDataPath = path.join(dataDir, `${userID}.json`);
  fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
}

function loadAllUserData() {
  const allUserData = {};
  fs.readdirSync(dataDir).forEach(file => {
    if (file.endsWith('.json')) {
      const userID = path.basename(file, '.json');
      allUserData[userID] = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    }
  });
  return allUserData;
}
