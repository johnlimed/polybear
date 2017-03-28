const express = require('express');
const teleConfig = require('../config/telegramConfig');
const polarbear = require('../modules/polarbear');
const httpsrequests = require('../modules/httpsrequests');
const rethink = require('../modules/rethink');

const router 	= express.Router();

router.get('/', (req, res) => {
  res.send({ data: 'hello' });
  // rethink.connect(dbconfig[process.env.NODE_ENV], (err, conn) => {
  //   rethink.table('users').run(conn, (getErr, result) => {
  //     if (getErr) {
  //       res.status(500);
  //       res.send({ error: getErr });
  //     }
  //     res.send({ data: result });
  //   });
  // });
});

// router.post('/register', (req, res) => {
//   rethink.connect(dbconfig[process.env.NODE_ENV], async (err, conn) => {
//     try {
//       const result = await rethink.table('users').insert({ name: req.body.name }, { returnChanges: true }).run(conn);
//       // const myToken = jwt.sign({ name: req.body.name }, 'my super awesome tele bot')
//       conn.close();
//       res.send({ data: result });
//     } catch (tryErr) {
//       console.log('Error caught in registration of user');
//       res.send({ error: tryErr });
//     }
//   });
// });

// router.get('/getMe', (req, res) => {
//   console.log('hello I am here');
//   const options = {
//     hostname: 'api.telegram.org',
//     port: 443,
//     path: encodeURI(`/bot${teleConfig.token}/getME`),
//     method: 'GET',
//   };
//   const result = https.request(options, (httpRes) => {
//     console.log('statusCode:', httpRes.statusCode);
//     console.log('headers:', httpRes.headers);
//     httpRes.on('data', (d) => {
//       res.send(d);
//     });
//   });
//   result.on('error', (err) => {
//     console.log(err);
//     res.send({ error: err });
//   });
//   result.end();
// });

// router.get(`/webhook/${teleConfig.token}`, (req, res) => {
//   console.log('received a webhook from telegram!');
//   res.send('hi');
// });

router.post(`/webhook/${teleConfig.token}`, async (req, res) => {
  try {
    console.log('received a webhook from telegram!');
    console.log(req.body);
    await rethink.insertIntoWebhook(req.body);
    if (req.body.edited_message) {
      req.body.message = req.body.edited_message;
    }
    const entities = req.body.message.entities;
    const text = req.body.message.text;
    const botCommand = req.body.message.entities ? req.body.message.entities[0].type === 'bot_command' : false;
    const bodyMessage = req.body.message;
    let statusRes = { code: 200, msg: 'Ok!' };
    console.log('entities are: ', entities);
    console.log('is botCommand? ', botCommand);
    if (text) {
      const inputs = text.split(' ');
      const command = inputs[0];
      const args = inputs.splice(1, inputs.length);
      if (botCommand) {
        statusRes = await polarbear(command, bodyMessage, args);
      }
      console.log('text: ', text);
      console.log('command: ', command);
      console.log('args: ', args);
    }
    res.status(statusRes.code).send(statusRes.msg);
  } catch (err) {
    console.log(err);
    httpsrequests.sendMessage(req.body.message, `Sorry, something broke... please contact my handler ${err}`);
    res.status(200).send(`Broken... not OK! ${err}`);
  }
});

module.exports = router;
