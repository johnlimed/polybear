const httpsrequests = require('./httpsrequests');
const teleConfig = require('../config/telegramConfig');

createReplyKeyboardMarkup = (keyboardButtonOptions) => {

};

initializeWebhook = () => {
  console.log('Setting up telegram webhook!');
  const payload = { url: `https://37f6f72c.ngrok.io/webhook/${teleConfig.token}` };
  const uri = `https://api.telegram.org/bot${teleConfig.token}/setWebhook`;
  httpsrequests.post(payload, uri);
};

sendMessage = (chatID, msg, parseMode) => {
  const payload = { chat_id: chatID, text: msg, parse_mode: parseMode };
  const uri = `https://api.telegram.org/bot${teleConfig.token}/sendMessage`;
  httpsrequests.post(payload, uri);
};

module.exports.createReplyKeyboardMarkup = createReplyKeyboardMarkup;
module.exports.initializeWebhook = initializeWebhook;
module.exports.sendMessage = sendMessage;
