const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');

const activePolarbearGames = [];
PolaybearGame = (chatID, status, players, joinTimer, actionTimer, dayTimer, voteTimer) => {
  this.chatID = chatID;
  this.status = status;
  this.players = players;
  this.joinTimer = joinTimer;
  this.actionTimer = actionTimer;
  this.dayTimer = dayTimer;
  this.voteTimer = voteTimer;
};
Player = (role, faction) => {
  this.role = role;
  this.faction = faction;
};
const factions = ['village', 'polar bear', 'lovers'];
const roles = ['polar bear', 'villager', 'little girl', 'doctor'];

alreadyRunningGame = roomID => activePolarbearGames.includes(roomID);
createGame = (bodyMessage) => {
  const game = new PolarbearGame()
  activePolarbearGames.push(bodyMessage.from.id);
};

module.exports = {
  '/register': bodyMessage => new Promise((resolve, reject) => {
    const sender = bodyMessage.from;
    rethink.connect(dbconfig[process.env.NODE_ENV], async (err, conn) => {
      try {
        const result = await rethink.table('users').insert({ teleID: sender.id, name: sender.username }, { returnChanges: true }).run(conn);
        conn.close();
        resolve({ code: 200, msg: `OK! ${result}` });
      } catch (tryErr) {
        console.log('Error caught in registration of user');
        reject(tryErr);
      }
    });
  }),
  '/start': bodyMessage => new Promise((resolve, reject) => {
    const roomID = bodyMessage.from.id;
    if (alreadyRunningGame(roomID)) {
      // return already in game message!
      resolve({ code: 200, msg: 'OK! already in game!' });
    } else {
      createGame();
      activePolarbearGames.push(bodyMessage.from.id);
      resolve({ code: 200, msg: 'OK! Successfully started game!' });
    }
  }),
};
