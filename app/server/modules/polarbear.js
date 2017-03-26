const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');
const certificates = require('../config/certificates');
const teleConfig = require('../config/telegramConfig');
const Timr = require('timrjs');
const request = require('request');

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
  const game = new PolarbearGame()
  activePolarbearGames.push(bodyMessage.from.id);
};
sendMessage = (bodyMessage, msg) => {
  const payload = { chat_id: bodyMessage.chat.id, text: msg };
  const options = {
    method: 'POST',
    uri: `https://api.telegram.org/bot${teleConfig.token}/sendMessage`,
    json: payload,
    agentOptions: {
        cert: certificates.certificate,
        key: certificates.privateKey,
    },
  };
	request(options, (err, res, body) => {
		if (err) {
			console.log('there was an error with the request ', err);
		} else {
			console.log('successfully sent a message!');
			// console.log('success! ', body);
		}
	});
}

module.exports = {
  '/register': bodyMessage => new Promise((resolve, reject) => {
    const sender = bodyMessage.from;
    rethink.connect(dbconfig[process.env.NODE_ENV], async (err, conn) => {
      try {
        const result = await rethink.table('users').insert({ teleID: sender.id, name: sender.username, chatID: bodyMessage.chat.id }, { returnChanges: true }).run(conn);
        conn.close();
        resolve({ code: 200, msg: `OK! ${result}` });
      } catch (tryErr) {
        console.log('Error caught in registration of user');
        reject(tryErr);
      }
    });
  }),
  '/start': bodyMessage => new Promise((resolve, reject) => {
    const roomID = bodyMessage.from.id;
    console.log(`roomID is ${roomID}, the roomArray is ${activePolarbearGames}`)
    if (alreadyRunningGame(roomID)) {
      // return already in game message!
      console.log('Found a game running!')
      resolve({ code: 200, msg: 'OK! already in game!' });
    } else {
      // const timer = ;
      activePolarbearGames.push(roomID);
      const timer = Timr('00:05')
      console.log('after timer')
      timer.ticker((_ref) => {
        if (_ref.percentageDone === 50 || _ref.percentageDone === 75 || _ref.percentageDone === 90) {
          console.log(`${_ref.percentageDone} left to join the game!`);
        }
        console.log(`${_ref.percentageDone}`)
      })
      timer.finish((self) => {
        sendMessage(bodyMessage, self);
        console.log(`Times up! gotta starting game? ${self}`);
        resolve({ code: 200, msg: 'OK! Successfully started game!' });
      });
      resolve({ code: 200, msg: 'OK! Successfully started game!' });
    }
  }),
};
