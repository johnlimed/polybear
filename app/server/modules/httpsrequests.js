const request = require('request');
const certificates = require('../config/certificates');

module.exports = {
  post: (payload, uri) => {
    const options = {
      method: 'POST',
      uri,
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
        console.log(payload)
      }
    });
  },
};
