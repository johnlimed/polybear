const express = require('express');
const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');
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

module.exports = router;
