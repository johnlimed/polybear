const rethink = require('../modules/rethink');
const httpsrequests = require('./httpsrequests');
const PolarbearSession = require('./polarbearSession');

const activePolarbearGames = [];
const activePolarbearSessions = {};

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
    case '/playerlist':
    case '/playerlist@poly_polarbear_bot': {
      try {
        if (alreadyRunningGame(roomID)) {
          activePolarbearSessions[roomID].getPlayerList();
        } else { httpsrequests.sendMessage(bodyMessage, 'There isn\'t a game running, start a polar bear game with /start.'); }
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
          console.log(activePolarbearSessions[roomID].getStatus());
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
