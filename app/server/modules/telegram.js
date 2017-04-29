const httpsrequests = require('./httpsrequests');
const teleConfig = require('../config/telegramConfig');

createKeyboardButton = async (keyboardButtonOptions) => {
  const arrayOfKeyboardButtons = keyboardButtonOptions.map(option => ([{ text: option }]));
  const result = await Promise.all(arrayOfKeyboardButtons);
  return result;
};

createReplyKeyboardMarkup = keyboardButtonOptions => new Promise(async (resolve) => {
  try {
    const keyboard = await createKeyboardButton(keyboardButtonOptions);
    resolve({ keyboard, one_time_keyboard: true });
  } catch (err) {
    console.log(err);
  }
});

initializeWebhook = () => {
  console.log('Setting up telegram webhook!');
  const payload = { url: teleConfig.webhookURI };
  const uri = teleConfig.setWebhook;
  httpsrequests.post(payload, uri);
};

sendMessage = (chatID, msg, keyboard) => {
  const payload = { chat_id: chatID, text: msg, reply_markup: keyboard };
  const uri = teleConfig.sendMsgURI;
  httpsrequests.post(payload, uri);
};

sendGameEnd = (chatID) => {
  console.log('simulating end command from telegram');
  const payload = {
    message: {
      chat: {
        id: chatID,
      },
      entities: [{ type: 'bot_command' }],
      text: '/finishGame',
      from: {
        username: 'poly_polarbear_bot',
      },
    },
  };
  const uri = teleConfig.webhookURI;
  httpsrequests.post(payload, uri);
};

module.exports.createReplyKeyboardMarkup = createReplyKeyboardMarkup;
module.exports.initializeWebhook = initializeWebhook;
module.exports.sendMessage = sendMessage;
module.exports.sendGameEnd = sendGameEnd;
