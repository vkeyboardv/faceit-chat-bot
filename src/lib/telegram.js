const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');

class Telegram {
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;

    this.instance = new TelegramBot(this.botToken, { polling: true });

    // Matches "/ping"
    this.instance.onText(/^(\/ping)$/, (msg, _match) => {
      const chatId = msg.chat.id;

      console.log('ping', { from });

      const html = `pong`;

      if (chatId === this.chatId) {
        this.instance.sendMessage(chatId, html, {
          parse_mode: 'HTML',
        });
      }
    });

    // Matches "/promote <faceitName>"
    this.instance.onText(/\/promote (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;

      const telegramUserId = msg.from.id;
      const faceitName = match[1];

      if (chatId === this.chatId) {
        const accountsJson = await fs.readJson('./accounts.json');

        const index = accountsJson.findIndex(account => {
          return Number(account.telegramUserId) === Number(telegramUserId);
        });

        if (index === -1) {
          accountsJson.push({ telegramUserId, faceitName });
        } else {
          accountsJson[index].faceitName = faceitName;
        }

        await fs.writeJson('./accounts.json', accountsJson);

        const admins = await this.getChatAdministrators();

        const adminIndex = admins.findIndex(admin => {
          return Number(admin.user.id) === Number(telegramUserId);
        });

        if (adminIndex === -1) {
          await this.promoteChatMember(chatId, telegramUserId, { can_manage_chat: true });
        }

        this.instance.sendMessage(chatId, html, {
          parse_mode: 'HTML',
        });
      }
    });
  }

  send(msg) {
    return this.instance.sendMessage(this.chatId, msg, { parse_mode: 'HTML' });
  }

  sendSilent(msg) {
    return this.instance.sendMessage(this.chatId, msg, { parse_mode: 'HTML', disable_notification: true });
  }

  setChatAdministratorCustomTitle(userId, title) {
    return this.instance.setChatAdministratorCustomTitle(this.chatId, userId, title);
  }

  promoteChatMember(userId, options) {
    return this.instance.promoteChatMember(this.chatId, userId, options);
  }

  getChatAdministrators() {
    return this.instance.getChatAdministrators(this.chatId);
  }
}

module.exports = Telegram;
