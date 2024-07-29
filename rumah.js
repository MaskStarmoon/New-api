const axios = require("axios");
const path = require("path");
const fs = require("fs");

module.exports = {
    config: {
        name: "rumah",
        aliases: ["house"],
        version: "1.0",
        author: "Unknown", // claim logica code by I M Range
        description: "rumah beli/lihat/upgrade/bersihkan/jual/rank",
        category: "fun",
        guide: ""
    },
    onStart: async function ({ message, event, usersData, args }) {
        const send = message;
        const userID = event.senderID;
        const rumah = "rumah mewah";
        const rumah = "rumah kaya";
        const url = `https://nash-rest-api.vercel.app/pinterest?search=${rumah}`;
        const respon = await axios.get(url);
        const gmbr = respon.data.data.data[0];

        const userDataPath = path.join("./rumahdata.json");

       let userData = {};
         try {
        const fileData = fs.readFileSync(userDataPath, 'utf8');
 if (fileData.trim().length > 0) {
  userData = JSON.parse(fileData);
  }
} catch (error) {
 
  console.error(error); 
 
}
       if (!userData[userID]) {
 
   userData[userID] = [];
 
}
        
        const cmd = args[0];

     if (cmd === "beli") {
        const rumah = args.join(" ");
        const money = await usersData.get(event.senderID, "money");
        const harga = 2000000;
      if (uang < harga) return send.reply(`uang mu kurang ${harga}^^`);
      if (!rumah) return send.reply("masukan nama rumah mu");

      await usersData.set(event.senderID, { money: money - harga });

        const saveData = {
        rumah: rumah,
        level: 0,
        kebersihan: 100,
        harga: 0
};

      userData[userID].push(saveData);
 
          try {
 
await fs.writeFileSync(userDataPath, JSON.stringify(userData), 'utf8');
 
} catch (error) {
 
 console.error(error);
 
  }
}
        
   }
};
          // catatan: belum selesai
