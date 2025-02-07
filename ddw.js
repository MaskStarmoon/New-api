ini code ddw.js, jangan ubah apapun dulu!,
const { createCanvas, loadImage, registerFont } = require("canvas");
const fs = require('fs');
const axios = require("axios").create({
  httpsAgent: new (require("https").Agent)({
    rejectUnauthorized: true,
  }),
});
const fontPath = "./hady-zen/asset/ShortBaby.ttf";
const filePath = "./hady-zen/asset/status_ddw.png";
const fontUrl = "https://cdn.glitch.global/879acb21-cf87-407e-9394-5807551d147b/ShortBaby.ttf?v=1738030514024";

module.exports = { 
  config: { 
    nama: "ddw",
    penulis: "Range", 
    kuldown: 20,
    peran: 0,
    tutor: "Dynamix Dream World"
  }, 

  Alya: async function ({ api, event, args, getData, setData, getAllData }) { 
    const awal = args[0];
    const userID = event.senderID;
    const isAdmin = global.config.admin.includes(userID);
    let userData = await getData(userID);
    const pilih = ["buat", "leveling", "party", "pvp", "dungeon", "status", "top"];
  		if (!userData.charDDW) return api.sendMessage("Daftarkan diri mu untuk bergabung ke dunia ini!, Gunakan /ddw buat", event.threadID, event.messageID);
      
    // 1. Buat karakter dan pilih class
    if (awal === pilih[0]) {
      if (userData.charDDW) {
        return api.sendMessage("Kamu sudah memiliki karakter!", event.threadID, event.messageID);
      }
      const charName = args[1];
      const charClass = args[2];
      if (!charName || !["Warrior", "Mage", "Archer", "Assassin"].includes(charClass)) {
        return api.sendMessage("Gunakan format: /ddw buat [NamaKarakter] [Class]\nClass yang tersedia: Warrior, Mage, Archer, Assassin", event.threadID, event.messageID);
      }
      userData.charDDW = {
        charName: charName,
        charClass,
        charExp: 0,
        charCP: 0,
        charWeapon: charClass === "Warrior" ? "Pedang" :
                    charClass === "Mage" ? "Tongkat Sihir" :
                    charClass === "Archer" ? "Busur" : "Dagger",
        charWM: 0,
        charTitle: "-",
        charTimeCreate: Date.now()
      };
      await setData(userID, userData);
      return api.sendMessage(`🎮 Selamat Datang Di Dunia Dynamix Dream World (DDW)!\n👋 User ${charName}, Kamu pasti akan menjadi ${charClass} yang hebat suatu hari nanti!\n✨ Petualanganmu baru saja dimulai...`, event.threadID, event.messageID);
    }

    // 2. Leveling untuk mendapatkan money dan charExp
    else if (awal === pilih[1]) {
    if (!userData.charDDW) {
        // skip
      } else {
    const levelingCost = 40;
  	if (!userData.money || userData.money < levelingCost) return api.sendMessage(`Kamu membutuhkan ${levelingCost} uang untuk melakukan leveling. Uang kamu saat ini: ${userData.money || 0}`, event.threadID, event.messageID);

    const expGained = Math.floor(Math.random() * 50) + 10;
    const moneyGained = Math.floor(Math.random() * 100) + 20;
    userData.money -= levelingCost;
    userData.charDDW.charExp += expGained;
    userData.charDDW.charCP = Math.floor(userData.charDDW.charExp / 4);
    userData.money = (userData.money || 0) + moneyGained;

    await setData(userID, userData);
    return api.sendMessage(`Leveling selesai!\nExp: +${expGained}\nCP: ${userData.charDDW.charCP}\nMoney: +${moneyGained}`, event.threadID, event.messageID);
      }
  }

    // 3. Membuat party sementara
    else if (awal === pilih[2]) {
    const action = args[0]; // "create" atau "join"
    const partyName = args.slice(1).join(" ");

    const data = await getData(userID); // Ambil data pengguna
    if (!data.charDDW) data.charDDW = {}; // Pastikan objek ada

    if (action === "create") {
        if (partyName.length > 10) return api.sendMessage("Nama party terlalu panjang.", event.threadID, event.messageID);
        if (data.charDDW[userID]) return api.sendMessage("Kamu sudah memiliki party yang aktif.", event.threadID, event.messageID);

        const createdAt = Date.now();
        data.charDDW[userID] = {
            partyName,
            leader: userID,
            members: [userID],
            createdAt
        };

        await setData(userID, data);
        api.sendMessage(`Party "${partyName}" berhasil dibuat!`, event.threadID, event.messageID);

        // Party otomatis dihapus setelah 1 jam (3600000 ms)
        setTimeout(async () => {
            const updatedData = await getData(userID) || {};
            delete updatedData.charDDW[userID];
            await setData(userID, updatedData);
            api.sendMessage(`Party "${partyName}" telah dibubarkan setelah 1 jam.`, event.threadID);
        }, 3600000);
    } 

    else if (action === "join") {
        if (!partyName) return api.sendMessage("Masukkan nama party yang ingin kamu gabung.", event.threadID, event.messageID);

        const allData = await getAllData();
        let foundParty = null;

        for (const user in allData) {
            if (allData[user].charDDW && allData[user].charDDW[user].partyName === partyName) {
                foundParty = allData[user].charDDW[user];
                break;
            }
        }

        if (!foundParty) return api.sendMessage("Party tidak ditemukan!", event.threadID, event.messageID);
        if (foundParty.members.length >= 4) return api.sendMessage("Party sudah penuh!", event.threadID, event.messageID);

        foundParty.members.push(userID);
        await setData(foundParty.leader, { charDDW: { [foundParty.leader]: foundParty } });

        return api.sendMessage(`Kamu berhasil bergabung dengan party "${partyName}"!`, event.threadID, event.messageID);
    } 

    else {
        return api.sendMessage("Gunakan perintah:\n- `!party create [nama]` untuk membuat party\n- `!party join [nama]` untuk bergabung ke party", event.threadID, event.messageID);
    }
}


    // 4. Player vs Player (PvP)
    else if (awal === pilih[3]) {
      return api.sendMessage(
        "Fitur PvP belum tersedia, tetapi akan segera hadir!", 
        event.threadID, event.messageID
      );
    }

    // 5. Memasuki Dungeon
    else if (awal === pilih[4]) {
      return api.sendMessage(
        "Fitur Dungeon belum tersedia, tetapi akan segera hadir!", 
        event.threadID, event.messageID
      );
    }

    // 6. Menampilkan status karakter pengguna
    else if (awal === pilih[5]) {
      const char = userData.charDDW;
      const exp = char.charExp;
      const totalExp = exp + 100;
      let level = Math.floor(totalExp / 100);
      
      if (args[1] === "text") { return api.sendMessage(`📊Status Karakter\nName: ${char.charName}\nClass: ${char.charClass}\nLevel: ${level}\nExp: ${char.charExp}\nWeapon: ${char.charWeapon}\nCP: ${char.charCP}`, event.threadID, event.messageID); } else {

      try {
        const background = await loadImage("https://cdn.glitch.global/879acb21-cf87-407e-9394-5807551d147b/ddwStatus.png?v=1738029799975");
        const { width, height } = background;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");
        const sty = (200, 200);

        registerFont(fontPath, { family: "ShortBaby" });
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const paddingRight = 900;
        const rightX = canvas.width - paddingRight;
        ctx.fillStyle = "#ffffff";
        ctx.font = "80px ShortBaby"; 
        const title = "Status Karakter";
        const titleWidth = ctx.measureText(title).width;
        const titleX = rightX - titleWidth; 
        const titleY = 310;
        ctx.fillText(title, titleX, titleY);

        ctx.font = "80px ShortBaby";
        const infoStartY = 458;
        const infoSpacing = 125;

        ctx.fillText(`  ${char.charName}`, rightX - 200, infoStartY); 
        ctx.fillText(` ${char.charClass}`, rightX - 200, infoStartY + infoSpacing);
        ctx.fillText(` ${level}`, rightX - 200, infoStartY + (2 * infoSpacing));
        ctx.fillText(`${char.charExp}`, rightX - 200, infoStartY + (3 * infoSpacing));
        ctx.fillText(`      ${char.charWeapon}`, rightX - 200, infoStartY + (4 * infoSpacing));
        ctx.fillText(`             ${char.charCP}`, rightX - 200, infoStartY + (5 * infoSpacing));

        const expBarWidth = 600;
        const gerak = 1350;
        const samping = 150;
        const expPercentage = (char.charExp % 100) / 100;
        ctx.fillStyle = "#555555";
        ctx.fillRect(samping, gerak, expBarWidth, 30);
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(samping, gerak, expBarWidth * expPercentage, 30);
        fs.writeFileSync(filePath, canvas.toBuffer());
        api.sendMessage(
          {
            body: `📊 Status Karakter ${char.charName}`,
            attachment: fs.createReadStream(filePath),
          },
          event.threadID,
          event.messageID,
        );
      } catch (error) {
        api.sendMessage(
          "Terjadi kesalahan saat memuat status karakter.",
          event.threadID,
          event.messageID
        );
      }
      setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Terjadi kesalahan saat menghapus file:", err);
      } else {
        console.log("File gambar telah dihapus!");
      }
    });
  }, 4000)
      }
      }
    // 7. Menampilkan daftar Top berdasarkan Combat Power (charCP)
    else if (awal === pilih[6]) {
  const allUsers = await getAllData();
  const allCharacters = Object.values(allUsers)
    .filter(user => user.charDDW) 
    .map(user => ({
      charName: user.charDDW.charName,
      charCP: user.charDDW.charCP
    }));
  if (allCharacters.length === 0) return api.sendMessage("Belum ada karakter yang terdaftar di dunia ini.", event.threadID, event.messageID);
  const sortedCharacters = allCharacters.sort((a, b) => b.charCP - a.charCP);
  const topList = sortedCharacters.slice(0, 10)
    .map((char, index) => `${index + 1}. ${char.charName} - CP: ${char.charCP}`)
    .join("\n");
  api.sendMessage(`🏆 Top 10 Combat Power (CP):\n\n${topList}`, event.threadID, event.messageID);
} else {
    return api.sendMessage("Perintah tidak dikenali. Gunakan salah satu dari perintah berikut:\n- buat\n- leveling\n- party\n- pvp\n- dungeon\n- status\n- top", event.threadID, event.messageID);
    }
   }
};
