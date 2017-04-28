const Timer = require('timer.js');
const Telegram = require('./telegram');

module.exports = function PolarbearSession(chatID) {
  const minPlayers = 5;
  const specialVillagers = ['little girl', 'doctor'];

  sendTelegramMessage = (msg, receiver) => {
    try {
      const receiverIDs = [];
      if (receiver === 'all') {
        receiverIDs.push(this.id);
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
      if (!this.isTest) {
        console.log(`sending messages to: ${JSON.stringify(receiverIDs)}`);
        receiverIDs.map(chatRoomID => Telegram.sendMessage(chatRoomID, msg));
      }
    } catch (err) {
      console.log('error while trying to send telegram message [polarbearSession]');
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
  this.numVillagers = 4;
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
    action: {
      tick: 1,
      ontick: (ms) => {
        if (Math.round(ms / 1000) === 30) {
          // if 30 sec remaining
          // sendTelegramMessage(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if ((Math.round(ms / 1000) < 10) && (Math.round(ms / 1000) % 1 === 0)) {
          // for every second less than 10 sec:
          // sendTelegramMessage(`${Math.round(ms / 1000)} sec left to joined the game!`);
        } else if (Math.round(ms / 1000) % 60 === 0) {
          // for every other minute:
          // sendTelegramMessage(`${Math.round(ms / 1000 / 60)} min left to joined the game!`);
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
    sendTelegramMessage(`Polarbears please check your inbox I have given you instructions! You have ${this.getTimerDuration('action')} min to act!.`);
    sendTelegramMessage(`Polarbears please wake up, select your meal for the night. You have ${this.getTimerDuration('action')} min to make up your mind. Otherwise it would have been an unsuccessful hunt!`, 'polarbears');
    sendTelegramMessage('Please consult your other polarbears. If there is no unanimous vote, the villager with the majority vote will be hunted.', 'polarbears');
    this.timers.action.timer.start(this.timers.action.duration).on('end', () => {
      console.log('End of polarbear phase!');
      if (this.votingArray.length === 0) {
        // nobody to kill
        // send message
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
      }
      resolve(mostVotes);
    });
    // TODO: get the array of alive villagers and send them to the polarbears for selection
    // send polarbears a personal msg to get their selection
  });
  this.littleGirlPhase = () => new Promise((resolve) => {
    this.status = 'littleGirl';
    sendTelegramMessage(`Little girl please check your inbox I have given you instructions! You have ${this.getTimerDuration('action')} min to act!.`);
    sendTelegramMessage(`Little girl please wake up, select on who you want to spy on. You have ${this.getTimerDuration('action')} min to make up your mind. Otherwise you would have slept in!`, 'little girl');
    this.timers.action.timer.start(this.timers.action.duration).on('end', () => {
      console.log('End of Little Girl phase!');
      if (this.littleGirlSpyOn === '') {
        // nobody selected..
        // slept in
        // TODO: send message that you slept in
      } else {
        // TODO: send message with options
        // send selected player's details to little girl
        const peekPlayerName = this.littleGirlSpyOn;
      }
      resolve();
    });
    // send options to select player
  });
  this.doctorPhase = (playerKilledByPolarbears, playersToKill) => new Promise((resolve) => {
    this.status = 'doctor';
    sendTelegramMessage(`Doctor please check your inbox I have given you instructions! You have ${this.getTimerDuration('action')} min to act!.`);
    sendTelegramMessage(`Doctor please wake up, . You have ${this.getTimerDuration('action')} min to make up your mind. Otherwise you would have slept in!`, 'doctor');
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
    // TODO: send message to doctor and ask for his selection
  });
  villagersPhase = () => new Promise((resolve) => {
    this.status = 'villagers';
    this.votingArray = [];
    const voteCount = {};
    let mostVotes;
    let mostVotesCount = 0;
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
      resolve(mostVotes);
    });
    // TODO: send messages to villagers
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
    sendTelegramMessage('The night has come, Polarbears get ready for the hunt! Villagers hide your wives, hide your kids, find the polarbears but beware for love conquers all.');
    this.assignRoles();
    while (this.status !== 'finished') {
      const playersToKill = []
      const playerSelectedByPolarbears = await this.polarbearPhase();
      await this.littleGirlPhase();
      await this.doctorPhase(playerSelectedByPolarbears, playersToKill);
      // elimination decision
      // TODO: eliminate player if necessary
      const killedByVillagers = await this.villagersPhase();
      // TODO: eliminate palyer
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
