const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');

module.exports = {
  '/register': bodyMessage => new Promise((resolve, reject) => {
    const sender = bodyMessage.from;
    rethink.connect(dbconfig[process.env.NODE_ENV], async (err, conn) => {
      try {
        const result = await rethink.table('users').insert({ teleID: sender.id, name: sender.username }, { returnChanges: true }).run(conn);
        conn.close();
        resolve(result);
      } catch (tryErr) {
        console.log('Error caught in registration of user');
        reject(tryErr);
      }
    });
  }),
  '/start': bodyMessage => new Promise((resolve, reject) => {
    resolve('hello')
  }),
};
