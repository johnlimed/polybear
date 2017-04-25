const request = require('request');
const certificates = require('../config/certificates');
const teleConfig = require('../config/telegramConfig');

module.exports = {
  setupWebhook: () => {
    console.log('Setting up telegram webhook!');
    const payload = { url: `https://06954e1b.ngrok.io/webhook/${teleConfig.token}` };
    const options = {
      method: 'POST',
      uri: `https://api.telegram.org/bot${teleConfig.token}/setWebhook`,
      json: payload,
      agentOptions: {
        cert: certificates.certificate,
        key: certificates.privateKey,
      },
    };
    request(options, (err) => {
      if (err) {
        console.log('there was an error with the request ', err);
      } else {
        console.log('successfully setup webhook!');
      }
    });
  },
  sendMessage: (bodyMessage, msg, parseMode) => {
    const payload = { chat_id: bodyMessage.chat.id, text: msg, parse_mode: parseMode };
    const options = {
      method: 'POST',
      uri: `https://api.telegram.org/bot${teleConfig.token}/sendMessage`,
      json: payload,
      agentOptions: {
          cert: certificates.certificate,
          key: certificates.privateKey,
      },
    };
    request(options, (err) => {
      if (err) {
        console.log('there was an error with the request ', err);
      } else {
        console.log('successfully sent a message!');
      }
    });
  },
};
