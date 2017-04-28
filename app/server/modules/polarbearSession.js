const Timer = require('timer.js');
const Telegram = require('./telegram');

module.exports = function PolarbearSession(chatID) {
  const minPlayers = 5;
  const specialVillagers = ['little girl', 'doctor'];

  generateReceivers = receiver => new Promise((resolve) => {
    const receiverIDs = [];
    if (receiver === 'all') {
      // receiverIDs.push(this.id);
      this.alivePolarbears.map(polarbear => receiverIDs.push(this.players[polarbear.name].id));
      this.aliveVillagers.map(villager => receiverIDs.push(this.players[villager.name].id));
    } else if (receiver === 'polarbears') {
      this.alivePolarbears.map(polarbear => receiverIDs.push(this.players[polarbear.name].id));
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

  notifyAssignedRoles = () => {
    this.aliveVillagers.map((villager) => {
      console.log(`villager: ${villager} ${this.players[villager].id} ${this.players[villager].role}`);
      const msg = `You are a ${this.players[villager].role}!`;
      return Telegram.sendMessage(this.players[villager].id, msg);
    });
    this.alivePolarbears.map((polarbear) => {
      console.log(`polarbear: ${polarbear} ${this.players[polarbear].id} ${this.players[polarbear].role}`);
      const msg = `You are a ${this.players[polarbear].role}!`;
      return Telegram.sendMessage(this.players[polarbear].id, msg);
    });
    this.aliveLovers.map((lover) => {
      console.log(`lover: ${lover}`);
      const msg = `And you are in love with: ${JSON.stringify(this.aliveLovers, null, 2)}!`;
      return Telegram.sendMessage(this.players[lover].id, msg);
    });
  };

  notifyPlayers = async (msg, receiver) => {
    try {
      const receiverIDs = await generateReceivers(receiver);
      if (!this.isTest) {
        console.log(`sending messages to: ${JSON.stringify(receiverIDs)}`);
        receiverIDs.map(chatRoomID => Telegram.sendMessage(chatRoomID, msg));
      }
    } catch (err) {
      console.log('error while trying to notify players [polarbearSession]');
      console.log(err);
    }
  };

  notifyPlayersWithAction = async (msg, receiver, candidates) => {
    try {
      const receiverIDs = await generateReceivers(receiver);
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
          notifyPlayers(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if ((Math.round(ms / 1000) < 7) && (Math.round(ms / 1000) % 1 === 0)) {
          // for every second less than 7 sec:
          notifyPlayers(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if (Math.round(ms / 1000) % 60 === 0) {
          // for every other minute:
          notifyPlayers(`${Math.round(ms / 1000 / 60)} min left to joined the game!`);
        }
      },
      onend: () => {
        if (enoughPlayers()) {
          this.startGame();
        } else {
          notifyPlayers('You need more Polarbears. Game did not start. Try again later.');
        }
      },
    },
    action: {
      tick: 1,
      ontick: (ms) => {
        if (Math.round(ms / 1000) === 30) {
          // if 30 sec remaining
          // notifyPlayers(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if ((Math.round(ms / 1000) < 10) && (Math.round(ms / 1000) % 1 === 0)) {
          // for every second less than 10 sec:
          // notifyPlayers(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if (Math.round(ms / 1000) % 60 === 0) {
          // for every other minute:
          // notifyPlayers(`${Math.round(ms / 1000 / 60)} min left to joined the game!`);
        }
      },
    },
  };
  this.timers = {
    join: {
      timer: new Timer(this.timerOptions.join),
      duration: 2 * 60,
    },
    // TODO: maybe need to remove this... as the polarbear, doctor & little girl needs to be initialized in their functions?
    action: {
      timer: new Timer(this.timerOptions.action),
      duration: 2 * 60,
    },
    vote: {
      timer: new Timer(),
      duration: 10,
    },
  };
  this.hasPlayerJoined = name => this.playerNameList.includes(name);
  this.joinGame = (name, playerID) => {
    this.players[name] = new Player(name, playerID);
    this.playerNameList.push(name);
    this.status = 'join';
  };
  enoughPlayers = () => {
    if (this.playerNameList.length >= minPlayers) return true;
    return false;
  };
  setPlayer = (role, faction, uninitializedPlayers) => {
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
    this.numPolarbears = Math.floor((numPlayers - 2) / 2);
    this.numVillagers = numPlayers - this.numPolarbears;
    // this.numPolarbears = 1;
    // this.numVillagers = 0;
    // this.playLovers = false;
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
      const playerID = this.players[this.playerNameList[i]].id;
      msg += `${playerName} ${playerFaction}  ${playerRole} ${playerStatus} ${playerID}\n`;
    }
    notifyPlayers(msg);
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
    notifyPlayers(`Polarbears please check your inbox I have given you instructions! You have ${this.getTimerDuration('action')} min to act!.`);
    notifyPlayers(`Polarbears please wake up, select your meal for the night. You have ${this.getTimerDuration('action')} min to make up your mind. Otherwise it would have been an unsuccessful hunt!`, 'polarbears');
    notifyPlayersWithAction('Who would become your meal? Please consult your other polarbears. If there is no unanimous vote, the villager with the majority vote will be hunted.', 'polarbears', this.aliveVillagers);
    this.timers.action.timer.start(this.timers.action.duration).on('end', () => {
      console.log('End of polarbear phase!');
      if (this.votingArray.length === 0) {
        // send message
        notifyPlayers('Nobody was selected! Nobody will die tonight...', 'polarbears');
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
        notifyPlayers(`You have selected ${mostVotes} as your meal.`, 'polarbears');
      }
      resolve(mostVotes);
    });
  });
  this.littleGirlPhase = () => new Promise((resolve) => {
    this.status = 'littleGirl';
    notifyPlayers(`Little girl please check your inbox I have given you instructions! You have ${this.getTimerDuration('action')} min to act!.`);
    notifyPlayers(`Little girl please wake up, select on who you want to spy on. You have ${this.getTimerDuration('action')} min to make up your mind. Otherwise you would have slept in!`, 'little girl');
    notifyPlayersWithAction('Who do you want to spy on?', 'littleGirl', [].concat(this.aliveVillagers, this.alivePolarbears));
    this.timers.action.timer.start(this.timers.action.duration).on('end', () => {
      console.log('End of Little Girl phase!');
      if (this.littleGirlSpyOn === '') {
        // nobody selected..
        notifyPlayers('You slept in tonight...', 'littleGirl');
      }
      // TODO: send message with options
      // send selected player's details to little girl
      const peekPlayerName = this.littleGirlSpyOn;
      resolve();
    });
  });
  this.doctorPhase = (playerKilledByPolarbears, playersToKill) => new Promise((resolve) => {
    this.status = 'doctor';
    notifyPlayers(`Doctor please check your inbox I have given you instructions! You have ${this.getTimerDuration('action')} min to act!.`);
    notifyPlayers(`Doctor please wake up, . You have ${this.getTimerDuration('action')} min to make up your mind. Otherwise you would have slept in!`, 'doctor');
    notifyPlayersWithAction(`${playerKilledByPolarbears} died tonight, do you want to use your one and only potion to save him?`, 'doctor', [playerKilledByPolarbears]);
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
  villagersPhase = (playersKilled) => new Promise((resolve) => {
    this.status = 'villagers';
    this.votingArray = [];
    const voteCount = {};
    let mostVotes;
    let mostVotesCount = 0;
    let killed = '';
    for (let i = 0; i < playersKilled.length; i += 1) {
      if (i > 0) {
        killed += 'and ';
      }
      killed += `${playersKilled[i]} `;
    }
    notifyPlayers(`Daybreaks! You wake up to find that ${killed} were found lying in a pool of blood!.`);
    notifyPlayers(`The whole village congregates. You have ${this.getTimerDuration('action')} min to decide who could be a polarbear. Vote to execute the polarbear!`);
    notifyPlayersWithAction('Who do you want to vote for?', 'all', [].concat(this.aliveVillagers, this.alivePolarbears));
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
      // TODO: send message to all about selection
      notifyPlayers(`The village has spoken, ${mostVotes} has been executed.`);
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
  this.startGame = async () => {
    notifyPlayers('The night has come, Polarbears get ready for the hunt! Villagers hide your wives, hide your kids, find the polarbears but beware for love conquers all.');
    this.assignRoles();
    notifyAssignedRoles();
    while (this.status !== 'finished') {
      const playersToKill = [];
      const playerSelectedByPolarbears = await this.polarbearPhase();
      await this.littleGirlPhase();
      await this.doctorPhase(playerSelectedByPolarbears, playersToKill);
      // elimination decision
      // TODO: eliminate player if necessary
      const killedByVillagers = await this.villagersPhase(playersToKill);
      // TODO: eliminate palyer
      this.winner = await this.checkForWinner();
    }
    this.endGame();
  };
  this.endGame = () => {
    notifyPlayers('Dawn breaks, and the Polarbears have overrun the village. Polarbears win!');
  };
  this.forceStart = () => {
    if (enoughPlayers()) {
      notifyPlayers('Force starting the game. Hang on to your fur.');
      this.timers.join.timer.stop();
      this.startGame();
    } else {
      notifyPlayers('You dont have enough Polarbears. Cannot start game. Wait for more Polarbears to /join.');
    }
  };
  this.stopTimer = (timerName) => { this.timers[timerName].timer.stop(); };
  this.startTimer = (timerName) => { this.timers[timerName].timer.start(this.timers[timerName].duration); };
  this.restartTimer = (timerName) => { this.timers[timerName].timer = new Timer(this.timers[timerName].duration / 60); };
  this.getTimerDuration = timerName => this.timers[timerName].duration / 60;
  this.extendTimer = (timerName) => {
    this.stopTimer(timerName);
    this.restartTimer(timerName);
    this.startTimer(timerName);
  };
  this.getStatus = () => this.status;
};
