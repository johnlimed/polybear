const express = require('express');
const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');
const teleConfig = require('../config/telegramConfig');
const https = require('https');
const http = require('http');
// const path = require('path');
// const utils  	= require('../modules/utils'),

const router 	= express.Router();

router.get('/', (req, res) => {
  rethink.connect(dbconfig[process.env.NODE_ENV], (err, conn) => {
    rethink.table('users').run(conn, (getErr, result) => {
      if (getErr) {
        res.status(500);
        res.send({ error: getErr });
      }
      res.send({ data: result });
    });
  });
});

router.post('/register', (req, res) => {
  rethink.connect(dbconfig[process.env.NODE_ENV], async (err, conn) => {
    try {
      const result = await rethink.table('users').insert({ name: req.body.name }, { returnChanges: true }).run(conn);
      res.send({ data: result });
    } catch (tryErr) {
      console.log('Error caught in registration of user');
      res.send({ error: tryErr });
    }
  });
});

router.get('/getMe', (req, res) => {
  const option = {
    method: 'CONNECT',
    path: `https://api.telegram.org/bot${teleConfig.token}/getME`,
  };
  // http.get(option, (httpRes) => {
  //   console.log(httpRes);
  // }).on('socket', (socket) => {
  //   socket.emit('agentRemove');
  // });
  const request = http.request(option);
  request.end();

  request.on('connect', (result, socket, head) => {
    console.log('Connected!')
    socket.on('data', (chunk) => {
      console.log(chunk.toString());
    });
  });

  // https.get(`https://api.telegram.org/${teleConfig}/getME`, (HTTPres) => {
  //   console.log('statusCode:', HTTPres.statusCode);
  //   console.log('headers:', HTTPres.headers);
  //
  //   HTTPres.on('data', (d) => {
  //     res.send({ data: d });
  //   });
  // }).on('error', (e) => {
  //   console.error(e);
  // });
});

module.exports = router;
