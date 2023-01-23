const nconf = require('nconf');

nconf.env().argv().file('config.json');

const Telegram = require('./lib/telegram');

const { botToken, chatId } = nconf.get('tg');

const telegram = new Telegram(botToken, chatId);

(async () => {
  try {
    const temp = await telegram.promoteChatMember(1419819727, { can_manage_chat: true });

    console.log({ temp });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
