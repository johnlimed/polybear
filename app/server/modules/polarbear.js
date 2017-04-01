const rethink = require('../modules/rethink');
const httpsrequests = require('./httpsrequests');
const Timer = require('timer.js');

const activePolarbearGames = [];
const activePolarbearSessions = {};

function PolarbearSession(chatID) {
  const factions = ['village', 'polar bear', 'lovers'];
  const roles = ['polar bear', 'villager', 'little girl', 'doctor'];

  function Player(name) {
    this.name = name;
    this.role = '';
    this.faction = '';
    this.setRole = (role) => {
      this.role = role;
    };
    this.setFaction = (faction) => {
      this.faction = faction;
    };
  }
  this.minPlayers = 5;
  this.maxPlayers = 20;
  this.numPolarbears = 1;
  this.numVillagers = 4;
  this.id = chatID;
  this.status = 'waiting';
  this.players = {};
  this.playerList = [];
  this.lovers = [];
  this.timers = {
    join: {
      timer: new Timer({
        tick: 1,
        ontick: (ms) => {
          // console.log(`${Math.round(ms / 1000)}s left`);
          if (Math.round(ms / 1000) === 30) {
            // if 30 sec remaining
            httpsrequests.sendMessage({ chat: { id: this.id } }, `${Math.round(ms / 1000)} sec left to joined the game!`);
          } else if ((Math.round(ms / 1000) < 10) && (Math.round(ms / 1000) % 1 === 0)) {
            // for every second less than 10 sec:
            httpsrequests.sendMessage({ chat: { id: this.id } }, `${Math.round(ms / 1000)} sec left to joined the game!`);
          } else if (Math.round(ms / 1000) % 60 === 0) {
            // for every other minute:
            httpsrequests.sendMessage({ chat: { id: this.id } }, `${Math.round(ms / 1000 / 60)} min left to joined the game!`);
          }
        },
      }),
      duration: 2 * 60,
    },
    action: {
      timer: new Timer(),
      duration: 10,
    },
    vote: {
      timer: new Timer(),
      duration: 10,
    },
  };
  this.addPlayer = (name) => {
    player = new Player(name);
    this.playerList.push(name);
    this.players.push(player);
  };
  this.start = () => {
    this.status = 'playing';
  };
  this.end = () => {
    this.status = 'end';
  };
  this.assignRoles = () => {
    for (let i = 0; i < players.length; i += 1) {
      players[i].setRole();
      players[i].setFaction();
    }
  };
  this.hasPlayerJoined = name => this.playerList.includes(name);
  this.joinGame = (name) => {
    this.players = new Player(name);
    this.playerList.push(name);
  };
  this.startTimer = (timerName) => {
    this.timers[timerName].timer.start(this.timers[timerName].duration);
  };
  this.getTimerDuration = timerName => this.timers[timerName].duration / 60;
}
alreadyRunningGame = roomID => activePolarbearGames.includes(roomID);
getPolarbearSession = roomID => activePolarbearSessions[roomID];
createGame = (roomID, name) => {
  activePolarbearGames.push(roomID);
  activePolarbearSessions[roomID] = new PolarbearSession(roomID);
  activePolarbearSessions[roomID].joinGame(name);
  console.log(`activePolarbearGames: ${activePolarbearGames}`);
  console.log(`activePolarbearSessions: ${activePolarbearSessions}`);
  console.log(activePolarbearSessions);
  return activePolarbearSessions[roomID];
};

module.exports = (command, bodyMessage) => new Promise(async (resolve, reject) => {
  const sender = bodyMessage.from;
  const name = sender.username ? sender.username : `${sender.first_name} ${sender.last_name}`;
  switch (command) {
    case '/register':
    case '/register@poly_polarbear_bot': {
      try {
        const result = await rethink.registerUser(sender.id, name, bodyMessage.chat.id);
        if (result.alreadyRegistered) { httpsrequests.sendMessage(bodyMessage, `${name} you are already a polar bear. Stop trying to be one.`); } else if (result.error) {
          httpsrequests.sendMessage(bodyMessage, `I broke trying to register you... ${result.error}`);
          reject(result.error);
        } else { httpsrequests.sendMessage(bodyMessage, `${name} turned into a polar bear! Welcome!`); }
        resolve({ code: 200, msg: 'OK!' });
      } catch (err) { reject(err); }
      break;
    }
    case '/join':
    case '/join@poly_polarbear_bot': {
      const roomID = bodyMessage.chat.id;
      if (alreadyRunningGame(roomID)) {
        if (activePolarbearSessions[roomID].hasPlayerJoined(name)) {
          // already joined
          httpsrequests.sendMessage(bodyMessage, `${name} you have already joined the game`);
        } else {
          // join game
          activePolarbearSessions[roomID].joinGame(name);
          httpsrequests.sendMessage(bodyMessage, `${name} has successfully joined the game!`);
        }
      } else {
        // no game, start game?
        httpsrequests.sendMessage(bodyMessage, 'There isn\'t a game running, start a polar bear game with /start');
      }
      resolve({ code: 200, msg: 'OK!' });
      break;
    }
    case '/start':
    case '/start@poly_polarbear_bot': {
      const roomID = bodyMessage.chat.id;
      console.log(`roomID is ${roomID}, the roomArray is ${activePolarbearGames}`);
      if (alreadyRunningGame(roomID)) {
        console.log('Found a game running!');
        httpsrequests.sendMessage(bodyMessage, 'Polar bears are already gathering to start a game. /join that one!');
        resolve({ code: 200, msg: 'OK!' });
      } else {
        // activePolarbearGames.push(roomID);
        const polarbearGame = createGame(roomID, name);
        polarbearGame.startTimer('join');
        httpsrequests.sendMessage(bodyMessage, `${name} has started and joined a game! /join ${name} and become a polar bear. ${polarbearGame.getTimerDuration('join')} minutes to join!`);
        // const setTime = 2;
        // let timeSpent = 0;
        // setTimeout(() => {
        //   clearTimeout();
        //   console.log('Times up! gotta starting game?');
        //   httpsrequests.sendMessage(bodyMessage, 'The polar bears have gathered, villagers hide the children, the night has come!');
        //   resolve({ code: 200, msg: 'OK!' });
        // }, setTime * 60000);
        // const id1 = setInterval(() => {
        //   timeSpent += 1;
        //   console.log(`${setTime - timeSpent} minutes left to join the game!`);
        //   httpsrequests.sendMessage(bodyMessage, `${setTime - timeSpent} minutes remaining to /join the polar bears!`);
        //   if (setTime - timeSpent === 1) {
        //     clearInterval(id1);
        //   }
        // }, 60000);
        // console.log('after timer');
        resolve({ code: 200, msg: 'OK! Successfully started game!' });
      }
      break;
    }
    case '/startgame': {
      httpsrequests.sendMessage(bodyMessage, `No ${name}`);
      resolve({ code: 200, msg: 'OK!' });
      break;
    }
    default: {
      httpsrequests.sendMessage(bodyMessage, `${name} I cannot understand you... please speak polar bear`);
      resolve({ code: 200, msg: 'OK!' });
    }
  }
});
