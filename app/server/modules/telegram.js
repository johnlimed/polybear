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
  const payload = { url: `https://a8a37ef6.ngrok.io/webhook/${teleConfig.token}` };
  const uri = `https://api.telegram.org/bot${teleConfig.token}/setWebhook`;
  httpsrequests.post(payload, uri);
};

sendMessage = (chatID, msg, keyboard) => {
  const payload = { chat_id: chatID, text: msg, reply_markup: keyboard };
  const uri = `https://api.telegram.org/bot${teleConfig.token}/sendMessage`;
  httpsrequests.post(payload, uri);
};

module.exports.createReplyKeyboardMarkup = createReplyKeyboardMarkup;
module.exports.initializeWebhook = initializeWebhook;
module.exports.sendMessage = sendMessage;
