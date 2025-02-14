const fs = require("fs");
const path = require("path");
const userDataPath = path.join(__dirname, "mineData.json");
const exchangeRatePath = path.join(__dirname, "exchangeRate.json");

// Daftar material (hasil mining)
const materials = [
  { id: 1, name: "Batu Biasa", emoji: "🪨", value: 10, rarity: "common" },
  { id: 2, name: "Tanah Liat", emoji: "🏺", value: 15, rarity: "common" },
  { id: 3, name: "Besi Tua", emoji: "🔩", value: 20, rarity: "common" },
  { id: 4, name: "Perak Murni", emoji: "🥈", value: 50, rarity: "rare" },
  { id: 5, name: "Kristal Kecil", emoji: "🔮", value: 75, rarity: "rare" },
  { id: 6, name: "Amber Kuno", emoji: "🟠", value: 100, rarity: "rare" },
  { id: 7, name: "Emas Padat", emoji: "🟡", value: 200, rarity: "epic" },
  { id: 8, name: "Diamond Mentah", emoji: "💎", value: 500, rarity: "epic" },
  { id: 9, name: "Meteorit", emoji: "☄️", value: 300, rarity: "epic" },
  { id: 10, name: "Star Fragment", emoji: "🌠", value: 1000, rarity: "legendary" },
  { id: 11, name: "Dragon Scale", emoji: "🐉", value: 1500, rarity: "legendary" },
  { id: 12, name: "Phoenix Feather", emoji: "🔥", value: 2000, rarity: "legendary" },
  { id: 13, name: "Ancient Relic", emoji: "🗿", value: 5000, rarity: "mythical" },
  { id: 14, name: "Celestial Orb", emoji: "🔆", value: 8000, rarity: "mythical" }
];

// Daftar item shop (termasuk pickaxe dan buff)
const shopItems = [
  { id: 101, name: "Basic Pickaxe", price: 50, effect: "Basic mining tool", type: "pickaxe", durability: 100 },
  { id: 102, name: "Uncommon Pickaxe", price: 100, effect: "Sedikit lebih tahan lama", type: "pickaxe", durability: 150 },
  { id: 103, name: "Rare Pickaxe", price: 200, effect: "Lebih efisien", type: "pickaxe", durability: 200 },
  { id: 104, name: "Epic Pickaxe", price: 300, effect: "Tahan lama", type: "pickaxe", durability: 300 },
  { id: 105, name: "Legendary Pickaxe", price: 500, effect: "Maksimal durability", type: "pickaxe", durability: 500 },
  { id: 201, name: "Lucky Charm", price: 200, effect: "+2% Legendary chance (1 jam)", type: "buff", buff: { luckBoost: 2 }, duration: 3600000 },
  { id: 202, name: "Mystery Box", price: 100, effect: "Random 3-5 materials", type: "other" }
];

const rarityWeights = {
  common: 80,
  rare: 15,
  epic: 4,
  legendary: 0.8,
  mythical: 0.2
};

// Multiplier harga jual berdasarkan rarity
const sellMultiplier = {
  common: 0.5,
  rare: 0.5,
  epic: 0.5,
  legendary: 0.5,
  mythical: 0.1
};

function loadUserData() {
  try {
    return JSON.parse(fs.readFileSync(userDataPath));
  } catch {
    return {};
  }
}

function saveUserData(data) {
  fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
}

// Mendapatkan exchange rate (diupdate tiap 1 jam)
function getExchangeRate() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(exchangeRatePath));
  } catch {
    data = { rate: 1, lastUpdate: 0 };
  }
  let now = Date.now();
  if (now - data.lastUpdate > 3600000) {
    let change = (Math.random() * 2) - 1; // antara -1 dan 1
    let newRate = 1 + change;
    if (newRate < 0.01) newRate = 0.01;
    data = { rate: newRate, lastUpdate: now };
    fs.writeFileSync(exchangeRatePath, JSON.stringify(data, null, 2));
  }
  return data;
}

function getRandomRarity(weights) {
  let total = Object.values(weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let rarity in weights) {
    if (rand < weights[rarity]) return rarity;
    rand -= weights[rarity];
  }
  return "common";
}

function getRandomMaterial() {
  const rarity = getRandomRarity(rarityWeights);
  const available = materials.filter(m => m.rarity === rarity);
  return available[Math.floor(Math.random() * available.length)];
}

module.exports = {
  config: { 
    nama: "mine", 
    penulis: "Edinst", 
    kuldown: 10,
    peran: 0,
    tutor: "!mine [jumlah] | sell [id/all] | sellm [id1] [id2] ... | shop | buy [id] [jumlah] | status | daily | inventory | tukar coin/money (jumlah)"
  }, 
  Alya: async function ({ api, event, args, getData, setData }) {
    // debug and edit by Range
    const userId = event.senderID;
    const userData = loadUserData();
    const dataSD = await getData(userId);
    if (!userData[userId]) {
      // Inisialisasi user baru: coin 50, SD money 0, 1 Basic Pickaxe
      userData[userId] = {
        inventory: {},
        balance: 50,
        sdMoney: 0,
        pickaxe: { id: 101, name: "Basic Pickaxe", durability: 100, maxDurability: 100 },
        luckBoosts: 0,
        luckExpiration: 0,
        lastDaily: 0
      };
    }
    const user = userData[userId];
    // Pastikan properti yang mungkin belum ada
    user.luckBoosts = user.luckBoosts || 0;
    dataSD.money = (typeof dataSD.money === "number") ? dataSD.money : 0;
    let message = "";
    if (args.length === 0) {
      message = "=== Mine Command Help ===\n";
      message += "1. Mining: !mine [jumlah] (gunakan pickaxe untuk mining)\n   contoh: !mine 3\n";
      message += "2. Sell: !mine sell [id/all] [jumlah] (jual satu item atau semua item)\n   contoh: !mine sell 1 2  atau  !mine sell all\n";
      message += "3. Sell Multi: !mine sellm [id1] [id2] ... (jual semua jumlah item berdasarkan ID)\n   contoh: !mine sellm 1 2 5\n";
      message += "4. Shop: !mine shop\n";
      message += "5. Buy: !mine buy [id] [jumlah] (beli item/pickaxe/buff)\n   contoh: !mine buy 101 1\n";
      message += "6. Status: !mine status\n";
      message += "7. Daily: !mine daily\n";
      message += "8. Inventory: !mine inventory\n";
      message += "9. Tukar: !mine tukar coin/money (jumlah) (min. 100)\n   contoh: !mine tukar coin 100  atau  !mine tukar money 100\n";
      api.sendMessage(message, event.threadID, event.messageID);
      saveUserData(userData);
      return;
    }
    let subcommand = args[0].toLowerCase();
    if (subcommand === "sell") {
      if (args[1] && args[1].toLowerCase() === "all") {
        let totalEarned = 0;
        let sellDetails = "";
        for (let itemId in user.inventory) {
          const quantity = user.inventory[itemId];
          const item = materials.find(m => m.id == itemId);
          if (!item) continue;
          const multiplier = sellMultiplier[item.rarity] || 0.5;
          const earned = Math.floor(item.value * quantity * multiplier);
          totalEarned += earned;
          sellDetails += `${item.name} x${quantity} => ${earned} coin\n`;
        }
        user.balance += totalEarned;
        user.inventory = {};
        message = `✅ Sell All:\n${sellDetails}\nTotal Earned: ${totalEarned} coin.`;
      } else {
        const sellId = parseInt(args[1]);
        const sellQty = parseInt(args[2]) || 1;
        if (!sellId || !user.inventory[sellId] || user.inventory[sellId] < sellQty) {
          message = "❌ Barang tidak cukup atau tidak ditemukan!";
        } else {
          const sellItem = materials.find(m => m.id == sellId);
          user.inventory[sellId] -= sellQty;
          if (user.inventory[sellId] <= 0) delete user.inventory[sellId];
          const multiplier = sellMultiplier[sellItem.rarity] || 0.5;
          const totalPrice = Math.floor(sellItem.value * sellQty * multiplier);
          user.balance += totalPrice;
          message = `✅ Terjual ${sellQty}× ${sellItem.name}\n   ID: ${sellItem.id}\n   Rarity: ${sellItem.rarity}\n   Total: ${totalPrice} coin.`;
        }
      }
    } else if (subcommand === "sellm") {
      let totalEarned = 0;
      let sellDetails = "";
      for (let i = 1; i < args.length; i++) {
        let id = parseInt(args[i]);
        if (!isNaN(id) && user.inventory[id]) {
          let quantity = user.inventory[id];
          const item = materials.find(m => m.id == id);
          const multiplier = sellMultiplier[item.rarity] || 0.5;
          let earned = Math.floor(item.value * quantity * multiplier);
          totalEarned += earned;
          sellDetails += `${item.name} x${quantity} => ${earned} coin\n`;
          delete user.inventory[id];
        }
      }
      if(totalEarned === 0) {
        message = "❌ Tidak ada item yang berhasil dijual!";
      } else {
        user.balance += totalEarned;
        message = `✅ Sell Multi:\n${sellDetails}\nTotal Earned: ${totalEarned} coin.`;
      }
    } else if (subcommand === "inventory") {
      if (Object.keys(user.inventory).length === 0) {
        message = "📦 Inventory kosong!";
      } else {
        message = "🎒 **Inventory Anda:**\n";
        for (let itemId in user.inventory) {
          const item = materials.find(m => m.id == itemId);
          if (item) {
            message += `\n📌 Nama: ${item.emoji} ${item.name} ×${user.inventory[itemId]}\n🔢 ID: ${item.id}\n⭐ Rarity: ${item.rarity}\n`;
          }
        }
      }
    } else if (subcommand === "status") {
      let now = Date.now();
      let remainingTime = user.luckExpiration > now ? Math.round((user.luckExpiration - now) / 60000) : 0;
      let buffStatus = user.luckExpiration > now ? `🎯 Buff: +${user.luckBoosts}% Luck (Sisa: ${remainingTime} menit)` : "❌ Tidak ada buff aktif.";
      let balanceStatus = `💰 Coin: ${user.balance} coin\n💸 SD Money: ${user.sdMoney} SD money`;
      let pickaxeStatus = user.pickaxe ? `🛠️ Pickaxe: ${user.pickaxe.name} (Durability: ${user.pickaxe.durability}/${user.pickaxe.maxDurability})` : "❌ Anda tidak memiliki pickaxe.";
      let rarityCount = {};
      for (let itemId in user.inventory) {
        let item = materials.find(m => m.id == itemId);
        if (item) rarityCount[item.rarity] = (rarityCount[item.rarity] || 0) + user.inventory[itemId];
      }
      let inventoryStatus = "📦 **Item per Rarity:**\n";
      Object.keys(rarityWeights).forEach(rarity => {
        inventoryStatus += `⭐ ${rarity}: ${rarityCount[rarity] || 0}\n`;
      });
      message = `🔍 **Mine Status**\n${buffStatus}\n${balanceStatus}\n${pickaxeStatus}\n${inventoryStatus}`;
      let rateData = getExchangeRate();
      message += `\n💱 Exchange Rate: 1 coin = ${rateData.rate.toFixed(2)} SD money (Update: ${new Date(rateData.lastUpdate).toLocaleTimeString()})`;
    } else if (subcommand === "daily") {
      let now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - user.lastDaily < oneDay) {
        message = "⏳ Anda sudah mengambil hadiah harian! Coba lagi besok.";
      } else {
        user.lastDaily = now;
        if (Math.random() < 0.7) {
          let reward = Math.floor(Math.random() * 91) + 10;
          user.balance += reward;
          message = `🎁 Daily: Anda mendapat ${reward} coin!`;
        } else {
          let commons = materials.filter(m => m.rarity === "common");
          let item = commons[Math.floor(Math.random() * commons.length)];
          user.inventory[item.id] = (user.inventory[item.id] || 0) + 1;
          message = `🎁 Daily: Anda mendapat item ${item.emoji} ${item.name} (ID: ${item.id}, Rarity: ${item.rarity}).`;
        }
      }
    } else if (subcommand === "shop") {
      message = "🛒 **Shop Item List:**\n";
      shopItems.forEach(item => {
        message += `\n📌 Nama: ${item.name}\n🔢 ID: ${item.id}\n💰 Harga: ${item.price} coin\n📝 Efek: ${item.effect}\n`;
      });
    } else if (subcommand === "buy") {
      let buyId = parseInt(args[1]);
      let buyQty = parseInt(args[2]) || 1;
      let shopItem = shopItems.find(i => i.id === buyId);
      if (!shopItem) {
        message = "❌ Item tidak ditemukan di shop!";
      } else if (user.balance < shopItem.price * buyQty) {
        message = "❌ Uang tidak cukup!";
      } else {
        user.balance -= shopItem.price * buyQty;
        if (shopItem.type === "buff") {
          user.luckBoosts += shopItem.buff.luckBoost * buyQty;
          user.luckExpiration = Date.now() + shopItem.duration * buyQty;
          message = `✅ Anda membeli ${shopItem.name}!\n🎯 Buff +${shopItem.buff.luckBoost * buyQty}% Luck aktif selama ${(shopItem.duration * buyQty) / 60000} menit.`;
        } else if (shopItem.type === "pickaxe") {
          user.pickaxe = { id: shopItem.id, name: shopItem.name, durability: shopItem.durability, maxDurability: shopItem.durability };
          message = `✅ Anda membeli ${shopItem.name}!\n🛠️ Durability: ${shopItem.durability}`;
        } else {
          user.inventory[buyId] = (user.inventory[buyId] || 0) + buyQty;
          message = `✅ Anda membeli ${buyQty}× ${shopItem.name}.`;
        }
      }
    } else if (subcommand === "tukar") {
      try {
      let tipe = args[1].toLowerCase();
      let jumlah = parseInt(args[2]);
      if ((tipe !== "coin" && tipe !== "money") || isNaN(jumlah)) {
        message = "❌ Format salah. Gunakan: !mine tukar coin/money (jumlah) (min. 100)";
      } else if (tipe === "coin") {
        if (jumlah < 10 || user.balance < jumlah) {
          message = "❌ Minimal tukar 100 coin atau saldo coin tidak mencukupi.";
        } else {
          let rateData = getExchangeRate();
          user.balance -= jumlah;
          let received = Math.floor(jumlah * rateData.rate);
          try {
          dataSD.money += received;
          await setData(userId, dataSD);
          message = `✅ Tukar: Anda menukar ${jumlah} coin menjadi ${received} SD money.\n💱 Rate: 1 coin = ${rateData.rate.toFixed(2)} SD money.`;
          } catch (error) {
            console.log("ERROR: " + "GAGAL, " + error.message);
          }
        }
      } else if (tipe === "money") {
        if (jumlah < 100 || user.sdMoney < jumlah) {
          message = "❌ Minimal tukar 100 SD money atau saldo SD money tidak mencukupi.";
        } else {
          let rateData = getExchangeRate();
          dataSD.money -= jumlah;
          await setData(userId, dataSD);
          let received = Math.floor(jumlah / rateData.rate);
          user.balance += received;
          message = `✅ Tukar: Anda menukar ${jumlah} SD money menjadi ${received} coin.\n💱 Rate: 1 coin = ${rateData.rate.toFixed(2)} SD money.`;
        }
      }
    } catch (error) {
      console.log("ERROR: " + error.message); 
      }
    } else if (!isNaN(subcommand)) {
      // Mining: cek apakah user punya pickaxe dengan durability > 0
      if (!user.pickaxe || user.pickaxe.durability <= 0) {
        message = "❌ Anda tidak memiliki pickaxe yang layak. Beli pickaxe dari shop terlebih dahulu.";
      } else {
        let mineCount = Math.min(parseInt(subcommand), 10);
        let minedItems = {};
        for (let i = 0; i < mineCount; i++) {
          let item = getRandomMaterial();
          user.inventory[item.id] = (user.inventory[item.id] || 0) + 1;
          minedItems[item.id] = (minedItems[item.id] || 0) + 1;
        }
        user.pickaxe.durability -= mineCount;
        if (user.pickaxe.durability < 0) user.pickaxe.durability = 0;
        let mineText = "⛏️ **Mining Result:**\n";
        for (let id in minedItems) {
          let item = materials.find(m => m.id == id);
          if (item) {
            mineText += `\n📌 Nama: ${item.emoji} ${item.name} ×${minedItems[id]}\n🔢 ID: ${item.id}\n⭐ Rarity: ${item.rarity}\n`;
          }
        }
        mineText += `\n🛠️ Pickaxe (${user.pickaxe.name}) durability tersisa: ${user.pickaxe.durability}/${user.pickaxe.maxDurability}`;
        message = mineText;
      }
    } else {
      message = "❌ Perintah tidak dikenali! Gunakan !mine untuk melihat daftar perintah.";
    }
    saveUserData(userData);
    api.sendMessage(message, event.threadID, event.messageID);
  }
};
