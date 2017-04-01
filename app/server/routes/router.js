const express = require('express');
const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');
const teleConfig = require('../config/telegramConfig');
const polarbear = require('../modules/polarbear');
// const https = require('https');
// const http = require('http');
// const jwt = require('jsonwebtoken');

// const path = require('path');
// const utils  	= require('../modules/utils'),

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

router.post('/login', (req, res) => {
    rethink.connect(dbconfig[process.env.NODE_ENV], async (err, conn) => {
      try {
        const result = [];
        const resultCursor = await rethink.table('users').filter({ name: req.body.name }).run(conn);
        let myToken = '';
        resultCursor.eachAsync((row) => {
          console.log(row);
          result.push(row);
        }).then(() => {
          console.log(result);
          if (result.length > 0) {
            myToken = jwt.sign({ name: req.body.name }, 'my super awesome tele bot');
          }
          res.send({ data: result, token: myToken });
        }).catch((err) => {
          res.send({ error: err });
        });
      } catch (tryErr) {
        console.log('Error caught while trying to login ', tryErr);
        res.send({ error: tryErr });
      }
    });
});

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
    const entities = req.body.message.entities;
    const text = req.body.message.text;
    const botCommand = req.body.message.entities[0].type === 'bot_command';
    const bodyMessage = req.body.message;
    let statusRes = { code: 200, msg: 'OK!' };
    console.log('entities are: ', entities || undefined);
    console.log('is botCommand? ', botCommand);
    if (botCommand) {
      statusRes = await polarbear[text](bodyMessage);
    }
    // console.log('text: ', text);
    // res.status(statusRes.code).send(statusRes.msg);
    res.status(200).send('OK!');
  } catch (err) {
    res.status(500).send('Broken... not OK!');
  }
});

module.exports = router;
