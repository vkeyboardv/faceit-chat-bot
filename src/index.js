const nconf = require('nconf');

nconf.env().argv().file('config.json');

const axios = require('axios');
const Telegram = require('./lib/telegram');

const accounts = require('./accounts.json');

const CronJob = require('cron').CronJob;

const { botToken, chatId } = nconf.get('tg');
const { timezone, pattern } = nconf.get('cron');

const telegram = new Telegram(botToken, chatId);

const start = async () => {
  console.log(`[${new Date().toISOString()}]: Start`);

  const fn = async account => {
    const url = `https://api.faceit.com/users/v1/nicknames/${account.faceitName}`;

    const { data } = await axios.get(url);

    const {
      payload: {
        games: {
          csgo: { faceit_elo, skill_level },
        },
      },
    } = data;

    await telegram.setChatAdministratorCustomTitle(account.telegramUserId, `${faceit_elo} ELO [${skill_level}]`);
    console.log(`[${new Date().toISOString()}]: Updated`, { faceit_elo, skill_level, url });
  };

  const promises = accounts.map(account => fn(account));

  try {
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
