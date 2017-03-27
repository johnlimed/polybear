const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');
const httpsrequests = require('./httpsrequests');

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
  const game = new PolarbearGame();
  activePolarbearGames.push(bodyMessage.from.id);
};

module.exports = (command, bodyMessage) => new Promise((resolve, reject) => {
  const sender = bodyMessage.from;
  switch (command) {
    case '/register':
    case '/register@poly_polarbear_bot': {
      rethink.connect(dbconfig[process.env.NODE_ENV], async (err, conn) => {
        try {
          const result = await rethink.table('users').insert({ teleID: sender.id, name: sender.username, chatID: bodyMessage.chat.id }, { returnChanges: true }).run(conn);
          conn.close();
          if (result.errors) {
            httpsrequests.sendMessage(bodyMessage, `${sender.username} you are already a polar bear. Stop trying to be one.`);
          } else {
            httpsrequests.sendMessage(bodyMessage, `${sender.username} turned into a polar bear! Welcome!`);
          }
          resolve({ code: 200, msg: `OK! ${result}` });
        } catch (tryErr) {
          console.log('Error caught in registration of user');
          reject({ code: 200, msg: `failed though :( ${tryErr}` });
        }
      });
      break;
    }
    case '/start':
    case '/start@poly_polarbear_bot': {
      const roomID = bodyMessage.chat.id;
      console.log(`roomID is ${roomID}, the roomArray is ${activePolarbearGames}`);
      if (alreadyRunningGame(roomID)) {
        console.log('Found a game running!');
        httpsrequests.sendMessage(bodyMessage, 'Polar bears are already trying to start a game. Join that one!');
        resolve({ code: 200, msg: 'OK! already in game!' });
      } else {
        activePolarbearGames.push(roomID);
        const setTime = 0;
        let timeSpent = 0;
        setTimeout(() => {
          console.log('Times up! gotta starting game?');
          resolve({ code: 200, msg: 'OK! Successfully started game!' });
        }, setTime * 60000);
        setInterval(() => {
          timeSpent += 1;
          console.log(`${setTime - timeSpent} minutes left to join the game!`);
        }, 60000);
        console.log('after timer');
        resolve({ code: 200, msg: 'OK! Successfully started game!' });
      }
      break;
    }
    default: {
      httpsrequests.sendMessage(bodyMessage, `${sender.username} I cannot understand you... please speak polar bear`);
      resolve({ code: 200, msg: 'OK! already in game!' });
    }
  }
});
