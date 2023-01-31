const nconf = require('nconf');

nconf.env().argv().file('config.json');

const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const Telegram = require('./lib/telegram');

const chatsPath = path.join(__dirname, './chats.json');

const CronJob = require('cron').CronJob;

const { botToken } = nconf.get('tg');
const { timezone, pattern } = nconf.get('cron');

const telegram = new Telegram(botToken);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const start = async () => {
  console.log(`[${new Date().toISOString()}]: Start`);

  const fn = async (chat) => {
    const { chatId, accounts } = chat;
    console.log(`[${new Date().toISOString()}]: Calling for chat`, { chatId });

    const promises = accounts.map(async (account) => {
      try {
        const url = `https://api.faceit.com/users/v1/nicknames/${account.faceitName}`;

        try {
          const { data } = await axios.get(url);

          await sleep(2000);

          const {
            payload: {
              games: {
                csgo: { faceit_elo, skill_level },
              },
            },
          } = data;

          await telegram.setChatAdministratorCustomTitle(
            chatId,
            account.telegramUserId,
            `${faceit_elo} ELO [${skill_level}]`,
          );
          console.log(
            `[${new Date().toISOString()}]: ${chatId}|${
              account.faceitName
            } - Updated elo ${faceit_elo}, lvl ${skill_level}`,
          );
        } catch (err) {
          console.log(`[${new Date().toISOString()}]: ${chatId}|${account.faceitName} - Updated error`);

          console.log(err.message);
        }
      } catch (err) {
        console.log(err.message);

        throw err;
      }
    });

    try {
      await Promise.all(promises);
    } catch (err) {
      console.log(err.message);

      throw err;
    }
  };

  try {
    const chatsJson = await fs.readJson(chatsPath);

    const promises = chatsJson.map((chat) => fn(chat));

    await Promise.all(promises);
  } catch (err) {
    `[${new Date().toISOString()}]: Error`, { message: err.message };
  }
};

(async () => {
  try {
    console.log(`[${new Date().toISOString()}]: Initializing a cron job - `, pattern);
    new CronJob(pattern, () => start(), null, true, timezone);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
