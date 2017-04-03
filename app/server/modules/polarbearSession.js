const Timer = require('timer.js');
const httpsrequests = require('./httpsrequests');

module.exports = function PolarbearSession(chatID) {
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
  this.getPlayerList = () => {
    httpsrequests.sendMessage({ chat: { id: this.id } }, 'The night has come, Polarbears get ready for the hunt! Villagers hide your wives, hide your kids, find the polarbears but beware for love conquers all. ');
  }
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
    } else {
      httpsrequests.sendMessage({ chat: { id: this.id } }, 'You dont have enough Polarbears. Cannot start game. Wait for more Polarbears to /join.');
    }
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
