const rethink = require('../modules/rethink');
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

module.exports = (command, bodyMessage, args) => new Promise(async (resolve, reject) => {
  const sender = bodyMessage.from;
  switch (command) {
    case '/register':
    case '/register@poly_polarbear_bot': {
      try {
        const username = sender.username ? sender.username : `${sender.first_name} ${sender.last_name}`;
        const result = await rethink.registerUser(sender.id, username, bodyMessage.chat.id);
        if (result.alreadyRegistered) { httpsrequests.sendMessage(bodyMessage, `${sender.username} you are already a polar bear. Stop trying to be one.`); } else if (result.error) {
          httpsrequests.sendMessage(bodyMessage, `I broke trying to register you... ${result.error}`);
          reject(result.error);
        } else { httpsrequests.sendMessage(bodyMessage, `${sender.username} turned into a polar bear! Welcome!`); }
        resolve({ code: 200, msg: `OK! ${result}` });
      } catch (err) { reject(err); }
      break;
    }
    case '/join':
    case '/join@poly_polarbear_bot': {
      httpsrequests.sendMessage(bodyMessage, `${sender.first_name} I am not ready yet :(`);
      resolve({ code: 200, msg: 'OK!' });
      break;
    }
    case '/start':
    case '/start@poly_polarbear_bot': {
      const roomID = bodyMessage.chat.id;
      console.log(`roomID is ${roomID}, the roomArray is ${activePolarbearGames}`);
      if (alreadyRunningGame(roomID)) {
        console.log('Found a game running!');
        httpsrequests.sendMessage(bodyMessage, 'Polar bears are already gathering to start a game. Join that one!');
        resolve({ code: 200, msg: 'OK! already in game!' });
      } else {
        activePolarbearGames.push(roomID);
        httpsrequests.sendMessage(bodyMessage, `${sender.username} has started a game! Join to become a polar bear`);
        const setTime = 2;
        let timeSpent = 0;
        setTimeout(() => {
          clearTimeout();
          console.log('Times up! gotta starting game?');
          httpsrequests.sendMessage(bodyMessage, 'The polar bears have gathered, villagers hide the children, the night has come!');
          resolve({ code: 200, msg: 'OK! Successfully started game!' });
        }, setTime * 60000);
        const id1 = setInterval(() => {
          timeSpent += 1;
          console.log(`${setTime - timeSpent} minutes left to join the game!`);
          httpsrequests.sendMessage(bodyMessage, `${setTime - timeSpent} minutes remaining to join the polar bears!`);
          if (setTime - timeSpent === 1) {
            clearInterval(id1);
          }
        }, 60000);
        console.log('after timer');
        resolve({ code: 200, msg: 'OK! Successfully started game!' });
      }
      break;
    }
    case '/startgame': {
      httpsrequests.sendMessage(bodyMessage, `No ${sender.username}`);
      resolve({ code: 200, msg: 'OK! already in game!' });
      break;
    }
    default: {
      httpsrequests.sendMessage(bodyMessage, `${sender.username} I cannot understand you... please speak polar bear`);
      resolve({ code: 200, msg: 'OK! already in game!' });
    }
  }
});
