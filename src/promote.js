const nconf = require('nconf');

nconf.env().argv().file('config.json');

const Telegram = require('./lib/telegram');

const { botToken } = nconf.get('tg');

const telegram = new Telegram(botToken);

const chatId = -1001887440131;
const telegramUserId = 1419819727;

(async () => {
  try {
    const temp = await telegram.promoteChatMember(chatId, telegramUserId, { can_manage_chat: true });

    console.log({ temp });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
