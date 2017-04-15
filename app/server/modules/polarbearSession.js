const Timer = require('timer.js');
const httpsrequests = require('./httpsrequests');

module.exports = function PolarbearSession(chatID) {
  // const factions = ['Villagers', 'Polarbears', 'Lovers'];
  // const roles = ['polar bear', 'villager'];
  const specialVillagers = ['little girl', 'doctor'];

  function Player(name, playerID) {
    this.name = name;
    this.id = playerID;
    this.role = '';
    this.faction = '';
    this.status = 'alive'; // alive, dead
    this.lover = null;
    this.isLover = false;
    this.setRole = (role) => { this.role = role; };
    this.setFaction = (faction) => { this.faction = faction; }; // Polarbears, Villagers, Lovers
    this.setStatus = (status) => { this.status = status; };
    this.setIsLover = (isLover) => { this.isLover = isLover; };
    this.setLover = (lover) => { this.lover = lover; };
  }
  const minPlayers = 5;
  this.maxPlayers = 20;
  this.numPolarbears = 1;
  this.numVillagers = 4;
  this.players = {};
  this.playerNameList = [];
  this.playLovers = true;
  this.mixLovers = false;
  this.loversAlive = true;
  this.lovers = [];
  this.littleGirl = '';
  this.doctor = '';
  this.alivePolarbears = [];
  this.aliveVillagers = [];
  // TODO: remove aliveLovers... seems not needed
  this.aliveLovers = [];
  this.winner = '';
  this.id = chatID;
  this.status = 'initialized'; // initialized, join, stopped, polarbear, littleGirl, doctor, villagers, finished
  this.isTest = false;
  this.timerOptions = {
    join: {
      tick: 1,
      ontick: (ms) => {
        if (Math.round(ms / 1000) === 30) {
          // if 30 sec remaining
          sendTelegramMessage(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if ((Math.round(ms / 1000) < 10) && (Math.round(ms / 1000) % 1 === 0)) {
          // for every second less than 10 sec:
          sendTelegramMessage(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if (Math.round(ms / 1000) % 60 === 0) {
          // for every other minute:
          sendTelegramMessage(`${Math.round(ms / 1000 / 60)} min left to joined the game!`);
        }
      },
      onend: () => {
        if (enoughPlayers()) this.startGame();
        sendTelegramMessage('You need more Polarbears. Game did not start. Try again later.');
      },
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
  sendTelegramMessage = (msg, parseMode) => {
    if (!this.isTest) {
      if (to === 'all') {
        httpsrequests.sendMessage({ chat: { id: this.id } }, msg, parseMode);
      } else if (to === 'polarbears') {
        for (let i = 0; i < this.alivePolarbears.length; i += 1) {
          httpsrequests.sendMessage({ chat: { id: this.players[this.alivePolarbears[i].name].id } }, msg, parseMode);
        }
      } else if (to === 'littleGirl') {
        // send to user.teleID
      } else if (to === 'doctor') {
        // send to user.teleID
      }
    }
  };
  this.hasPlayerJoined = name => this.playerNameList.includes(name);
  this.joinGame = (name, playerID) => {
    this.players[name] = new Player(name, playerID);
    this.playerNameList.push(name);
    this.status = 'join';
  };
  enoughPlayers = () => {
    if (this.playerNameList.length === minPlayers) return true;
    return false;
  };
  setPlayer = (role, faction, uninitializedPlayers) => {
    const playerArrayID = Math.floor(Math.random() * uninitializedPlayers.length);
    const playerName = uninitializedPlayers[playerArrayID];
    this.players[playerName].setRole(role);
    this.players[playerName].setFaction(faction);
    this[`alive${faction}`].push(playerName);
    uninitializedPlayers.splice(playerArrayID, 1);
  };
  setLovers = () => {
    const uninitializedPlayers = this.playerNameList.slice(0);
    for (let l = 0; l < 2; l += 1) {
      const playerArrayID = Math.floor(Math.random() * uninitializedPlayers.length);
      const playerName = uninitializedPlayers[playerArrayID];
      uninitializedPlayers.splice(playerArrayID, 1);
      this.players[playerName].setIsLover(true);
      this.lovers.push(playerName);
    }
    if (this.players[this.lovers[0]].faction !== this.players[this.lovers[1]].faction) {
      this.mixLovers = true;
      for (let i = 0; i < this.lovers.length; i += 1) {
        const playerIndex = this[`alive${this.players[this.lovers[i]].faction}`].indexOf(this.lovers[i]);
        this[`alive${this.players[this.lovers[i]].faction}`].splice(playerIndex, 1);
      }
      this.players[this.lovers[0]].faction = 'Lovers';
      this.players[this.lovers[1]].faction = 'Lovers';
    }
    this.loversAlive = true;
    this.aliveLovers = this.lovers.slice(0);
    this.players[this.lovers[0]].lover = this.players[this.lovers[1]].name;
    this.players[this.lovers[1]].lover = this.players[this.lovers[0]].name;
  };
  this.assignRoles = () => {
    const numPlayers = this.playerNameList.length;
    // this.numPolarbears = 1;
    this.numPolarbears = Math.floor((numPlayers - 2) / 2);
    this.numVillagers = numPlayers - this.numPolarbears;
    const uninitializedPlayers = this.playerNameList.slice(0);
    // set Polarbears
    for (let i = 0; i < this.numPolarbears; i += 1) {
      setPlayer('Polar bear', 'Polarbears', uninitializedPlayers);
    }
    // set special villagers
    for (let k = 0; k < specialVillagers.length; k += 1) {
      setPlayer(specialVillagers[k], 'Villagers', uninitializedPlayers);
    }
    // set Villagers
    for (let j = 0; j < this.numVillagers - 2; j += 1) {
      setPlayer('Villager', 'Villagers', uninitializedPlayers);
    }
    if (this.playLovers) {
      setLovers();
    }
  };
  this.getPlayerList = () => {
    let msg = 'Players that are in game:\n';
    for (let i = 0; i < this.playerNameList.length; i += 1) {
      const playerName = this.players[this.playerNameList[i]].name;
      const playerStatus = this.players[this.playerNameList[i]].status;
      const playerFaction = this.players[this.playerNameList[i]].faction;
      const playerRole = this.players[this.playerNameList[i]].role;
      msg += `${playerName} ${playerFaction}  ${playerRole} ${playerStatus}\n`;
    }
    sendTelegramMessage(msg);
  };
  polarbearPhase = () => new Promise((resolve) => {
    this.status = 'polarbear';
    // send polarbears a personal msg
    // wait for response
    // if
    resolve();
  });
  littleGirlPhase = () => new Promise((resolve) => {
    this.status = 'littleGirl';
    resolve();
  });
  doctorPhase = () => new Promise((resolve) => {
    this.status = 'doctor';
    resolve();
  });
  villagersPhase = () => new Promise((resolve) => {
    this.status = 'villagers';
    resolve();
  });
  removePlayerFromAliveList = (playerName) => {
    const faction = this.players[playerName].faction;
    this.players[playerName].status = 'dead';
    const playerIndex = this[`alive${faction}`].indexOf(playerName);
    this[`alive${faction}`].splice(playerIndex, 1);
  };
  this.eliminatePlayer = (playerName) => {
    if (this.players[playerName].isLover && !this.mixLovers) { this.aliveLovers = []; this.loversAlive = false; }
    if (this.players[playerName].isLover) { removePlayerFromAliveList(this.players[playerName].lover); }
    removePlayerFromAliveList(playerName);
  };
  this.checkForWinner = () => new Promise((resolve) => {
    const loversAlive = (this.mixLovers && this.loversAlive);
    const polarbearsAlive = this.alivePolarbears.length > 0;
    const villagersAlive = this.aliveVillagers.length > 0;
    if (loversAlive && !polarbearsAlive && !villagersAlive) {
      this.status = 'finished';
      resolve('Lovers');
    } else if (polarbearsAlive && !loversAlive && !villagersAlive) {
      this.status = 'finished';
      resolve('Polarbears');
    } else if (villagersAlive && !loversAlive && !polarbearsAlive) {
      this.status = 'finished';
      resolve('Villagers');
    }
    resolve('no winner');
  });
  this.startGame = async () => {
    sendTelegramMessage('The night has come, Polarbears get ready for the hunt! Villagers hide your wives, hide your kids, find the polarbears but beware for love conquers all.');
    this.assignRoles();
    while (this.status !== 'finished') {
      await polarbearPhase();
      await littleGirlPhase();
      await doctorPhase();
      await villagersPhase();
      this.winner = await this.checkForWinner();
    }
    this.endGame();
  };
  this.endGame = () => {
    sendTelegramMessage('Dawn breaks, and the Polarbears have overrun the village. Polarbears win!');
  };
  this.forceStart = () => {
    if (enoughPlayers()) {
      sendTelegramMessage('Force starting the game. Hang on to your fur.');
      this.timers.join.timer.stop();
      this.startGame();
    } else {
      sendTelegramMessage('You dont have enough Polarbears. Cannot start game. Wait for more Polarbears to /join.');
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
};
