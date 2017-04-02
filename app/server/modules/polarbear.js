const rethink = require('../modules/rethink');
const httpsrequests = require('./httpsrequests');
const Timer = require('timer.js');

const activePolarbearGames = [];
const activePolarbearSessions = {};

function PolarbearSession(chatID) {
  const factions = ['village', 'polar bear', 'lovers'];
  const roles = ['polar bear', 'villager'];
  const specialVillagers = ['little girl', 'doctor'];

  function Player(name) {
    this.name = name;
    this.role = '';
    this.faction = '';
    this.status = 'alive'; // alive, dead
    this.lover = null;
    this.isLover = false;
    this.setRole = (role) => { this.role = role; };
    this.setFaction = (faction) => { this.faction = faction; };
    this.setStatus = (status) => { this.status = status; };
    this.setIsLover = (isLover) => { this.status = isLover; };
    this.setLover = (lover) => { this.lover = lover; };
  }
  const minPlayers = 1;
  this.maxPlayers = 20;
  this.numPolarbears = 1;
  this.numVillagers = 4;
  this.players = {};
  this.playerNameList = [];
  this.uninitializedPlayers = [];
  this.playLovers = true;
  this.mixLovers = false;
  this.loversAlive = true;
  this.lovers = [];
  this.id = chatID;
  this.status = 'initialized'; // initialized, join, stopped, polarbear, littleGirl, doctor, voting, finished
  this.timerOptions = {
    join: {
      tick: 1,
      ontick: (ms) => {
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
      onend: () => {
        if (enoughPlayers()) this.startGame();
        httpsrequests.sendMessage({ chat: { id: this.id } }, 'You need more Polarbears. Game did not start. Try again later.');
      }
    },
  };
  this.timers = {
    join: {
      timer: new Timer(this.timerOptions.join),
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
  // this.addPlayer = (name) => {
  //   player = new Player(name);
  //   this.playerNameList.push(name);
  //   this.players[name] = player;
  // };
  this.hasPlayerJoined = name => this.playerNameList.includes(name);
  this.joinGame = (name) => {
    this.players[name] = new Player(name);
    this.playerNameList.push(name);
    this.status = 'join';
  };
  enoughPlayers = () => {
    if (this.playerNameList.length === minPlayers) return true;
    return false;
  };
  setPlayer = (role, faction) => {
    const playerArrayID = Math.floor(Math.random() * this.uninitializedPlayers.length);
    const playerName = this.uninitializedPlayers[playerArrayID];
    this.players[playerName].setRole(role);
    this.players[playerName].setFaction(faction);
    this.uninitializedPlayers.splice(playerArrayID, 1);
  };
  setLovers = () => {
    this.uninitializedPlayers = this.playerNameList;
    for (let l = 0; l < 2; l += 1) {
      const playerArrayID = Math.floor(Math.random() * this.uninitializedPlayers.length);
      const playerName = this.uninitializedPlayers[playerArrayID];
      this.uninitializedPlayers.splice(playerArrayID, 1);
      this.players[playerName].setIsLover(true);
      this.lovers.push(this.players[playerName]);
    }
    if (this.lovers[0].faction !== this.lovers[1].faction) {
      this.mixLovers = true;
    }
  };
  assignRoles = () => {
    const numPlayers = this.playerNameList.length;
    this.numPolarbears = 1;
    // this.numPolarbears = Math.floor((numPlayers - 2) / 2);
    this.numVillagers = numPlayers - this.numPolarbears;
    this.uninitializedPlayers = this.playerNameList;
    // set Polarbears
    for (let i = 0; i < this.numPolarbears; i += 1) {
      setPlayer('Polar bear', 'Polar bear');
    }
    // set special villagers
    // for (let k = 0; k < specialVillagers.length; k += 1) {
    //   setPlayer(specialVillagers[k], 'Villagers');
    // }
    // set Villagers
    // for (let j = 0; j < this.numVillagers - 2; i += 1) {
    //   setPlayer('Villager', 'Villager');
    // }
    // if (this.playLovers) {
    //   setLovers();
    // }
  };
  this.startGame = () => {
    this.status = 'polarbear';
    httpsrequests.sendMessage({ chat: { id: this.id } }, 'The night has come, Polarbears get ready for the hunt! Villagers hide your wives, hide your kids, find the polarbears but beware for love conquers all. ');
    assignRoles();
  };
  this.forceStart = () => {
    if (enoughPlayers()) {
      httpsrequests.sendMessage({ chat: { id: this.id } }, 'Force starting the game. Hang on to your fur');
      this.timers.join.timer.stop();
      this.startGame();
    }
    httpsrequests.sendMessage({ chat: { id: this.id } }, 'You dont have enough Polarbears. Cannot start game. Wait for more Polarbears to /join.');
  };
  this.startTimer = (timerName) => { this.timers[timerName].timer.start(this.timers[timerName].duration); };
  this.getTimerDuration = timerName => this.timers[timerName].duration / 60;
  this.extendTimer = (timerName) => {
    this.timers[timerName].timer.stop();
    this.timers[timerName].timer = new Timer(this.timerOptions.join);
    this.startTimer(timerName);
  };
  this.getStatus = () => this.status;
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
  const roomID = bodyMessage.chat.id;
  switch (command) {
    case '/register':
    case '/register@poly_polarbear_bot': {
      try {
        const result = await rethink.registerUser(sender.id, name, bodyMessage.chat.id);
        if (result.alreadyRegistered) { httpsrequests.sendMessage(bodyMessage, `${name} you are already a polar bear. Stop trying to be one.`); } else if (result.error) {
          httpsrequests.sendMessage(bodyMessage, `I broke trying to register you... ${result.error}`);
          reject(result.error);
        } else { httpsrequests.sendMessage(bodyMessage, `${name} turned into a polar bear. Welcome!`); }
        resolve({ code: 200, msg: 'OK!' });
      } catch (err) { reject(err); }
      break;
    }
    case '/extend':
    case '/extend@poly_polarbear_bot': {
      try {
        if (!alreadyRunningGame(roomID)) {
          httpsrequests.sendMessage(bodyMessage, `${name} there isn't any polarbears around. /start a game now!`);
        } else if (activePolarbearSessions[roomID].getStatus() === 'join') {
          activePolarbearSessions[roomID].extendTimer('join');
          httpsrequests.sendMessage(bodyMessage, `${name} extended the timer. Come on you polarbears! ${activePolarbearSessions[roomID].getTimerDuration('join')} minutes to join.`);
        } else {
          console.log(activePolarbearSessions[roomID].getStatus())
        }
        resolve({ code: 200, msg: 'OK!' });
      } catch (err) { reject(err); }
      break;
    }
    case '/join':
    case '/join@poly_polarbear_bot': {
      // const roomID = bodyMessage.chat.id;
      if (alreadyRunningGame(roomID)) {
        if (activePolarbearSessions[roomID].hasPlayerJoined(name)) {
          // already joined
          httpsrequests.sendMessage(bodyMessage, `${name} you have already joined the game.`);
        } else {
          // join game
          activePolarbearSessions[roomID].joinGame(name);
          httpsrequests.sendMessage(bodyMessage, `${name} has successfully joined the game!`);
        }
      } else {
        // no game, start game?
        httpsrequests.sendMessage(bodyMessage, 'There isn\'t a game running, start a polar bear game with /start.');
      }
      resolve({ code: 200, msg: 'OK!' });
      break;
    }
    case '/forcestart':
    case '/forcestart@poly_polarbear_bot': {
      try {
        if (alreadyRunningGame(roomID)) {
          activePolarbearSessions[roomID].forceStart();
        } else {
          // no game, start game?
          httpsrequests.sendMessage(bodyMessage, 'There isn\'t a game running, start a polar bear game with /start.');
        }
        resolve({ code: 200, msg: 'OK!' });
      } catch (err) { reject(err); }
      break;
    }
    case '/start':
    case '/start@poly_polarbear_bot': {
      console.log(`roomID is ${roomID}, the roomArray is ${activePolarbearGames}`);
      if (alreadyRunningGame(roomID)) {
        console.log('Found a game running!');
        httpsrequests.sendMessage(bodyMessage, 'Polar bears are already gathering to start a game. /join that one!');
        resolve({ code: 200, msg: 'OK!' });
      } else {
        const polarbearGame = createGame(roomID, name);
        polarbearGame.startTimer('join');
        httpsrequests.sendMessage(bodyMessage, `${name} has started and joined a game! Calling all Polarbears to /join! You have ${polarbearGame.getTimerDuration('join')} minutes to join!`);
        resolve({ code: 200, msg: 'OK!' });
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
