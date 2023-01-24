const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');

const chatsPath = path.join(__dirname, './../chats.json');

class Telegram {
  constructor(botToken) {
    this.botToken = botToken;

    this.instance = new TelegramBot(this.botToken, { polling: true });

    // Matches "/ping"
    this.instance.onText(/^(\/ping)$/, (msg, _match) => {
      console.log('ping', { from: msg.from.id });

      const chatId = msg.chat.id;
      const chatType = msg.chat.type;

      const html = `pong`;

      if (chatType === 'supergroup') {
        this.instance.sendMessage(chatId, html, {
          parse_mode: 'HTML',
        });
      }
    });

    // Matches "/promote <faceitName>"
    this.instance.onText(/^\/promote (.+)$/, async (msg, match) => {
      console.log('promote', { from: msg.from.id });

      const chatType = msg.chat.type;
      const chatId = msg.chat.id;

      const telegramUserId = msg.from.id;
      const faceitName = match[1];

      if (chatType === 'supergroup') {
        const chatsJson = await fs.readJson(chatsPath);

        const chatIndex = chatsJson.findIndex((chat) => {
          return Number(chat.chatId) === Number(chatId);
        });

        if (chatIndex === -1) {
          chatsJson.push({ chatId, accounts: [{ telegramUserId, faceitName }] });
        } else {
          const accounts = chatsJson[chatIndex].accounts;

          const accountIndex = accounts.findIndex((account) => {
            return Number(account.telegramUserId) === Number(telegramUserId);
          });

          if (accountIndex === -1) {
            chatsJson[chatIndex].accounts.push({ telegramUserId, faceitName });
          } else {
            chatsJson[chatIndex].accounts[accountIndex].faceitName = faceitName;
          }
        }

        await fs.writeJson(chatsPath, chatsJson);

        const admins = await this.getChatAdministrators(chatId);

        const adminIndex = admins.findIndex((admin) => {
          return Number(admin.user.id) === Number(telegramUserId);
        });

        if (adminIndex === -1) {
          await this.promoteChatMember(chatId, telegramUserId, { can_manage_chat: true });
        }

        const html = `done`;

        this.instance.sendMessage(chatId, html, {
          parse_mode: 'HTML',
        });
      }
    });
  }

  send(chatId, msg) {
    return this.instance.sendMessage(chatId, msg, { parse_mode: 'HTML' });
  }

  sendSilent(chatId, msg) {
    return this.instance.sendMessage(chatId, msg, { parse_mode: 'HTML', disable_notification: true });
  }

  setChatAdministratorCustomTitle(chatId, userId, title) {
    return this.instance.setChatAdministratorCustomTitle(chatId, userId, title);
  }

  promoteChatMember(chatId, userId, options) {
    return this.instance.promoteChatMember(chatId, userId, options);
  }

  getChatAdministrators(chatId) {
    return this.instance.getChatAdministrators(chatId);
  }
}

module.exports = Telegram;
