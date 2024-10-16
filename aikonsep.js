const axios = require('axios');
const prefixes = ['ara', 'ciliy'];

module.exports = {
  config: {
    name: "ara",
    aliases: [],
    version: "2.5.0",
    author: "I M Range", // don't change this author claim by I M Range
    shortDescription: "ask to gemini AI ( modification brain AI )",
    role: 0,
    countDown: 5,
    category: "AI",
    guide: {
      en: "{pn} <prompt>",
    },
  },
  onStart: ({}) => {},
  onChat: async function ({ message, usersData, event, api, args }) {
    if (prefixes.some(prefix => event.body.toLowerCase().startsWith(prefix))) {
      const chatData = await usersData.get(event.senderID);
      const boss = await usersData.getName(100082154359331); // you can change admin/owner make this ai in here
      const Input = args.join(" ");
      await usersData.set(event.senderID, { ...chatData, data: { ...chatData.data, history: Input }});
      const history = chatData.data.history || "Tidak ada history chat";
      const prompt = `Kamu adalah robot asisten AI yang dibuat oleh ${boss}, Nama kamu ara robot kucing yang manis dan imut, Kamu selalu mengunakan emot kucing lucu, Kamu selalu membantu pengguna dengan ramah. User Input: "${Input}", Chat History: "${history}"`; // this prompt
      message.reaction("⏳", event.messageID);
      
      const { data } = await axios.get(`https://api-rangestudio.vercel.app/api/gemini?text=${encodeURIComponent(prompt)}`);
      const response = data.answer;
      const userID = event.senderID;
      const name = await usersData.getName(userID);
      const ment = [{ id: userID, tag: name }];

      const fromMessage = {
        body: `@${name}, ${response}`,
        mentions: ment,
      };

      message.reply(fromMessage, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID
        });
      });

      message.reaction("✔", event.messageID);
    }
  },
  onReply: async function ({ message, usersData, Reply, event, api, args }) {
    const chatData = await usersData.get(event.senderID);
    const boss = await usersData.getName(100082154359331); // you can change admin/owner make this ai in here
    const Input = args.join(" ");
    await usersData.set(event.senderID, { ...chatData, data: { ...chatData.data, history: Input }});
    const history = chatData.data.history || "Tidak ada history chat";
    const prompt = `Kamu adalah robot asisten AI yang dibuat oleh ${boss}, Nama kamu ara robot kucing yang manis dan imut, Kamu selalu mengunakan emot kucing lucu, Kamu selalu membantu pengguna dengan ramah. User Input: "${Input}", Chat History: "${history}"`; // this prompt
    message.reaction("⏳", event.messageID);

    const { data } = await axios.get(`https://api-rangestudio.vercel.app/api/gemini?text=${encodeURIComponent(prompt)}`);
    const response = data.answer;
    const userID = event.senderID;
    const name = await usersData.getName(userID);
    const ment = [{ id: userID, tag: name }];

    const fromMessage = {
      body: `@${name}, ${response}`,
      mentions: ment,
    };

    message.reply(fromMessage, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        messageID: info.messageID,
        author: event.senderID
      });
    });

    message.reaction("✔", event.messageID);
  }
};
