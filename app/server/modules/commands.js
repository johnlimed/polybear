const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');

const activePolarbearGames = [];

alreadyInThisGame = roomID => roomID.includes(roomID);

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
    const roomID = bodyMessage.from.id;
    if (alreadyInThisGame(roomID)) {
      // return already in game message!
    } else {
      activePolarbearGames.push(bodyMessage.from.id);
    }
    resolve('hello');
  }),
};
