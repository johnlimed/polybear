const Timer = require('timer.js');
const Telegram = require('./telegram');

module.exports = function PolarbearSession(chatID) {
  const minPlayers = 5;
  const specialVillagers = ['little girl', 'doctor'];

  this.generateReceivers = receiver => new Promise((resolve) => {
    const receiverIDs = [];
    if (receiver === 'all') {
      // receiverIDs.push(this.id);
      this.alivePolarbears.map(polarbear => receiverIDs.push(this.players[polarbear].id));
      this.aliveVillagers.map(villager => receiverIDs.push(this.players[villager].id));
    } else if (receiver === 'polarbears') {
      this.alivePolarbears.map((polarbear) => {
        console.log(polarbear);
        return receiverIDs.push(this.players[polarbear].id);
      });
      // for (let i = 0; i < this.alivePolarbears.length; i += 1) {
      //   receiverIDs.push(this.players[this.alivePolarbears[i].name].id);
      // }
    } else if (receiver === 'littleGirl') {
      // send to user.teleID
      receiverIDs.push(this.players[this.littleGirl].id);
    } else if (receiver === 'doctor') {
      // send to user.teleID
      receiverIDs.push(this.players[this.doctor].id);
    } else {
      receiverIDs.push(this.id);
    }
    resolve(receiverIDs);
  });

  this.joinPlayersNames = nameList => new Promise((resolve) => {
    let string;
    for (let i = 0; i < nameList.length; i += 1) {
      if (i > 0 && (i === nameList.length - 1)) {
        string += 'and ';
      } else if (i > 0) {
        string += ', ';
      }
      killed += `${nameList[i]} `;
    }
    resolve(string);
  });

  this.notifyAssignedRoles = async () => {
    if (!this.isTest) {
      const villagerPromise = this.aliveVillagers.map((villager) => {
        console.log(`villager: ${villager} ${this.players[villager].id} ${this.players[villager].role}`);
        const msg = `You are a ${this.players[villager].role}!`;
        return Telegram.sendMessage(this.players[villager].id, msg);
      });
      const polarbearPromise = this.alivePolarbears.map((polarbear) => {
        console.log(`polarbear: ${polarbear} ${this.players[polarbear].id} ${this.players[polarbear].role}`);
        const polarbears = this.joinPlayersNames(this.alivePolarbears);
        const msg = `You are a ${this.players[polarbear].role}! The polarbears are: ${polarbears}`;
        return Telegram.sendMessage(this.players[polarbear].id, msg);
      });
      const loversPromise = this.aliveLovers.map((lover) => {
        console.log(`lover: ${lover}`);
        const msg = `And you are in love with: ${JSON.stringify(this.aliveLovers, null, 2)}!`;
        return Telegram.sendMessage(this.players[lover].id, msg);
      });
      await Promise.all(loversPromise, villagerPromise, polarbearPromise);
    }
  };

  this.notifyPlayers = async (msg, receiver) => {
    try {
      if (!this.isTest) {
        const receiverIDs = await this.generateReceivers(receiver);
        console.log(`sending messages to: ${JSON.stringify(receiverIDs)}`);
        receiverIDs.map(chatRoomID => Telegram.sendMessage(chatRoomID, msg));
      }
    } catch (err) {
      console.log('error while trying to notify players [polarbearSession]');
      console.log(err);
    }
  };

  this.notifyPlayersWithAction = async (msg, receiver, candidates) => {
    try {
      const receiverIDs = await this.generateReceivers(receiver);
      const keyboard = await Telegram.createReplyKeyboardMarkup(candidates);
      if (!this.isTest) {
        console.log(`sending messages to: ${JSON.stringify(receiverIDs)}`);
        receiverIDs.map(chatRoomID => Telegram.sendMessage(chatRoomID, msg, keyboard));
      }
    } catch (err) {
      console.log('error while trying to notify players with actions [polarbearSession]');
      console.log(err);
    }
  };

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
  this.id = chatID;
  this.maxPlayers = 20;
  this.numPolarbears = 1;
  this.numVillagers = 2;
  this.players = {};
  this.playerNameList = [];
  this.playLovers = true;
  this.mixLovers = false;
  this.loversAlive = true;
  this.lovers = [];
  this.littleGirl = '';
  this.littleGirlSpyOn = '';
  this.doctor = '';
  this.doctorAction = {
    usePotion: false,
    usePoison: false,
    healed: '',
    poisoned: '',
  };
  this.alivePolarbears = [];
  this.aliveVillagers = [];
  this.votingArray = [];
  // TODO: remove aliveLovers... seems not needed
  this.aliveLovers = [];
  this.winner = '';
  this.status = 'initialized'; // initialized, join, stopped, polarbear, littleGirl, doctor, villagers, finished
  this.isTest = false;
  this.timerOptions = {
    join: {
      tick: 1,
      ontick: (ms) => {
        if (Math.round(ms / 1000) === 30) {
          // if 30 sec remaining
          this.notifyPlayers(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if ((Math.round(ms / 1000) < 7) && (Math.round(ms / 1000) % 1 === 0)) {
          // for every second less than 7 sec:
          this.notifyPlayers(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if (Math.round(ms / 1000) % 60 === 0) {
          // for every other minute:
          this.notifyPlayers(`${Math.round(ms / 1000 / 60)} min left to joined the game!`);
        }
      },
      onend: () => {
        if (this.enoughPlayers()) {
          this.startGame();
        } else {
          this.notifyPlayers('You need more Polarbears. Game did not start. Try again later.');
          this.stopGame();
        }
      },
    },
    action: {
      tick: 1,
      ontick: (ms) => {
        if (Math.round(ms / 1000) === 30) {
          // if 30 sec remaining
          // this.notifyPlayers(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if ((Math.round(ms / 1000) < 10) && (Math.round(ms / 1000) % 1 === 0)) {
          // for every second less than 10 sec:
          // this.notifyPlayers(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if (Math.round(ms / 1000) % 60 === 0) {
          // for every other minute:
          // this.notifyPlayers(`${Math.round(ms / 1000 / 60)} min left to joined the game!`);
        }
      },
    },
  };
  this.timers = {
    join: {
      timer: new Timer(this.timerOptions.join),
      duration: 5 * 60,
    },
    // TODO: maybe need to remove this... as the polarbear, doctor & little girl needs to be initialized in their functions?
    action: {
      timer: new Timer(this.timerOptions.action),
      duration: 2 * 60,
    },
  };
  this.hasPlayerJoined = name => this.playerNameList.includes(name);
  this.joinGame = (name, playerID) => {
    this.players[name] = new Player(name, playerID);
    this.playerNameList.push(name);
    this.status = 'join';
  };
  this.enoughPlayers = () => {
    if (this.playerNameList.length >= minPlayers) return true;
    return false;
  };
  this.setPlayer = (role, faction, uninitializedPlayers) => {
    const playerArrayID = Math.floor(Math.random() * uninitializedPlayers.length);
    const playerName = uninitializedPlayers[playerArrayID];
    this.players[playerName].setRole(role);
    this.players[playerName].setFaction(faction);
    this[`alive${faction}`].push(playerName);
    uninitializedPlayers.splice(playerArrayID, 1);
    if (role === 'little girl') {
      this.littleGirl = playerName;
    } else if (role === 'doctor') {
      this.doctor = playerName;
    }
  };
  this.setLovers = () => {
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
  this.assignRoles = () => new Promise(async (resolve, reject) => {
    // generate roles first
    try {
      const numPlayers = this.playerNameList.length;
      this.numPolarbears = Math.floor((numPlayers - 2) / 2);
      this.numVillagers = numPlayers - this.numPolarbears;
      const polarbearsArray = new Array(this.numPolarbears).fill(0);
      const villagersArray = new Array(this.numVillagers - specialVillagers.length).fill(0);
      const uninitializedPlayers = this.playerNameList.slice(0);
      const promisePolar = polarbearsArray.map(() => this.setPlayer('Polar bear', 'Polarbears', uninitializedPlayers));
      await Promise.all(promisePolar);
      const promiseSpecial = specialVillagers.map(specialVillager => this.setPlayer(specialVillager, 'Villagers', uninitializedPlayers));
      await Promise.all(promiseSpecial);
      const promiseVillager = villagersArray.map(() => this.setPlayer('Villager', 'Villagers', uninitializedPlayers));
      await Promise.all(promiseVillager);
      if (this.playLovers) {
        this.setLovers();
      }
      resolve();
    } catch (err) {
      console.log('error caught while trying to asign roles');
      console.log(err);
      reject(err);
    }
  });
  this.getPlayerList = () => {
    let msg = 'Players that are in game:\n';
    for (let i = 0; i < this.playerNameList.length; i += 1) {
      const playerName = this.players[this.playerNameList[i]].name;
      const playerStatus = this.players[this.playerNameList[i]].status;
      const playerFaction = this.players[this.playerNameList[i]].faction;
      const playerRole = this.players[this.playerNameList[i]].role;
      const playerID = this.players[this.playerNameList[i]].id;
      msg += `${playerName} ${playerFaction} ${playerRole} ${playerStatus} ${playerID}\n`;
    }
    this.notifyPlayers(msg);
  };
  removePlayerFromAliveList = (playerName) => {
    const faction = this.players[playerName].faction;
    this.players[playerName].status = 'dead';
    const playerIndex = this[`alive${faction}`].indexOf(playerName);
    this[`alive${faction}`].splice(playerIndex, 1);
  };
  this.eliminatePlayer = (playerName) => {
    if (this.players[playerName].status === 'alive') {
      if (this.players[playerName].isLover && !this.mixLovers) { this.aliveLovers = []; this.loversAlive = false; }
      if (this.players[playerName].isLover) { removePlayerFromAliveList(this.players[playerName].lover); }
      removePlayerFromAliveList(playerName);
    }
  };
  this.voteFor = (playerName) => {
    this.votingArray.push(playerName);
  };
  this.polarbearPhase = () => new Promise((resolve) => {
    this.status = 'polarbear';
    this.votingArray = [];
    const voteCount = {};
    let mostVotes;
    let mostVotesCount = 0;
    this.notifyPlayers(`Polarbears please check your inbox I have given you instructions! You have ${this.getTimerDuration('action')} min to act!.`);
    this.notifyPlayers(`Polarbears please wake up, select your meal for the night. You have ${this.getTimerDuration('action')} min to make up your mind. Otherwise it would have been an unsuccessful hunt!`, 'polarbears');
    this.notifyPlayersWithAction('Who would become your meal? Please consult your other polarbears. If there is no unanimous vote, the villager with the majority vote will be hunted.', 'polarbears', this.aliveVillagers);
    this.timers.action.timer.start(this.timers.action.duration).on('end', () => {
      console.log('End of polarbear phase!');
      if (this.votingArray.length === 0) {
        // send message
        this.notifyPlayers('Nobody was selected! Nobody will die tonight...', 'polarbears');
      } else {
        for (let i = 0; i < this.votingArray.length; i += 1) {
          if (voteCount[votingArray[i]]) {
            voteCount[votingArray[i]] += 1;
          } else {
            voteCount[votingArray[i]] = 1;
          }
          if (voteCount[votingArray[i]] > mostVotesCount) {
            mostVotesCount = voteCount[votingArray[i]];
            mostVotes = votingArray[i];
          }
        }
        // TODO: send message to polarbears about selection
        this.notifyPlayers(`You have selected ${mostVotes} as your meal.`, 'polarbears');
      }
      resolve(mostVotes);
    });
  });
  this.littleGirlPhase = () => new Promise((resolve) => {
    this.status = 'littleGirl';
    this.notifyPlayers(`Little girl please check your inbox I have given you instructions! You have ${this.getTimerDuration('action')} min to act!.`);
    this.notifyPlayers(`Little girl please wake up, select on who you want to spy on. You have ${this.getTimerDuration('action')} min to make up your mind. Otherwise you would have slept in!`, 'little girl');
    this.notifyPlayersWithAction('Who do you want to spy on?', 'littleGirl', [].concat(this.aliveVillagers, this.alivePolarbears));
    this.timers.action.timer.start(this.timers.action.duration).on('end', () => {
      console.log('End of Little Girl phase!');
      if (this.littleGirlSpyOn === '') {
        // nobody selected..
        this.notifyPlayers('You slept in tonight...', 'littleGirl');
      }
      // TODO: send message with options
      // send selected player's details to little girl
      const peekPlayerName = this.littleGirlSpyOn;
      console.log(peekPlayerName);
      resolve();
    });
  });
  this.doctorPhase = (playerKilledByPolarbears, playersToKill) => new Promise((resolve) => {
    this.status = 'doctor';
    this.notifyPlayers(`Doctor please check your inbox I have given you instructions! You have ${this.getTimerDuration('action')} min to act!.`);
    this.notifyPlayers(`Doctor please wake up, . You have ${this.getTimerDuration('action')} min to make up your mind. Otherwise you would have slept in!`, 'doctor');
    this.notifyPlayersWithAction(`${playerKilledByPolarbears} died tonight, do you want to use your one and only potion to save him?`, 'doctor', [playerKilledByPolarbears]);
    // TODO: generate random duration if doctor has no more potions
    this.timers.action.timer.start(this.timers.action.duration).on('end', () => {
      console.log('End of Doctor phase!');
      if (!this.doctorAction.usePotion) {
        // doctor did not heal, put player into kill array
        playersToKill.push(playerKilledByPolarbears);
      }
      if (this.doctorAction.usePoision) {
        // poison player, put player into kill array
        playersToKill.push(this.doctorAction.poisoned);
      }
      resolve();
    });
  });
  villagersPhase = playersKilled => new Promise(async (resolve) => {
    this.status = 'villagers';
    this.votingArray = [];
    const voteCount = {};
    let mostVotes;
    let mostVotesCount = 0;
    const killed = await this.joinPlayersNames(playersKilled);
    this.notifyPlayers(`Daybreaks! You wake up to find that ${killed} were found lying in a pool of blood!.`);
    this.notifyPlayers(`The whole village congregates. You have ${this.getTimerDuration('action')} min to decide who could be a polarbear. Vote to execute the polarbear!`);
    this.notifyPlayersWithAction('Who do you want to vote for?', 'all', [].concat(this.aliveVillagers, this.alivePolarbears));
    this.timers.action.timer.start(this.timers.action.duration).on('end', () => {
      console.log('End of Villagers phase!');
      if (this.votingArray.length === 0) {
        // TODO: kill nobody
      } else {
        for (let i = 0; i < this.votingArray.length; i += 1) {
          if (voteCount[votingArray[i]]) {
            voteCount[votingArray[i]] += 1;
          } else {
            voteCount[votingArray[i]] = 1;
          }
          if (voteCount[votingArray[i]] > mostVotesCount) {
            mostVotesCount = voteCount[votingArray[i]];
            mostVotes = votingArray[i];
          }
        }
      }
      this.notifyPlayers(`The village has spoken, ${mostVotes} has been executed.`);
      resolve(mostVotes);
    });
  });
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
  this.endOfNight = async (playersToKill) => {
    const promise = playersToKill.map(playerName => this.eliminatePlayer(playerName));
    await Promise.all(promise);
  };
  this.startGame = async () => {
    this.notifyPlayers('The night has come, Polarbears get ready for the hunt! Villagers hide your wives, hide your kids, find the polarbears but beware for love conquers all.');
    await this.assignRoles();
    await this.notifyAssignedRoles();
    while (this.status !== 'finished') {
      const playersToKill = [];
      const playerSelectedByPolarbears = await this.polarbearPhase();
      await this.littleGirlPhase();
      await this.doctorPhase(playerSelectedByPolarbears, playersToKill);
      await this.endOfNight(playersToKill);
      const killedByVillagers = await this.villagersPhase(playersToKill);
      this.eliminatePlayer(killedByVillagers);
      this.winner = await this.checkForWinner();
    }
    this.endGame();
  };
  this.endGame = () => {
    if (!this.isTest) {
      if (this.winner === 'Polarbears') {
        this.notifyPlayers('Dawn breaks, and the Polarbears have overrun the village. Polarbears win!');
      } else if (this.winner === 'Villagers') {
        this.notifyPlayers('Dawn breaks, and the Villagers are still awake. Villagers win!');
      } else if (this.winner === 'Lovers') {
        this.notifyPlayers('Dawn breaks, love conquered all. Lovers win!');
      }
      this.getPlayerList();
    }
    this.stopGame();
  };
  this.forceStart = () => {
    if (this.enoughPlayers()) {
      this.notifyPlayers('Force starting the game. Hang on to your fur.');
      this.timers.join.timer.stop();
      this.startGame();
    } else {
      this.notifyPlayers('You dont have enough Polarbears. Cannot start game. Wait for more Polarbears to /join.');
    }
  };
  this.stopGame = () => {
    this.stopTimer('action');
    this.stopTimer('join');
    if (!this.isTest) {
      Telegram.sendGameEnd();
    }
  };
  this.stopTimer = (timerName) => { this.timers[timerName].timer.stop(); };
  this.startTimer = (timerName) => { this.timers[timerName].timer.start(this.timers[timerName].duration); };
  this.restartTimer = (timerName) => { this.timers[timerName].timer = new Timer(this.timerOptions[timerName]); };
  this.getTimerDuration = timerName => this.timers[timerName].duration / 60;
  this.extendTimer = (timerName) => {
    this.stopTimer(timerName);
    this.restartTimer(timerName);
    this.startTimer(timerName);
  };
  this.getStatus = () => this.status;
};
