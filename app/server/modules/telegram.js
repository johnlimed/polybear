const httpsrequests = require('./httpsrequests');

createReplyKeyboardMarkup = (keyboardButtonOptions) => {

};

sendMessage = (msg, sendingTo, parseMode) => {
  const to = sendingTo || 'all';
  if (!this.isTest) {
    if (to === 'all') {
      httpsrequests.sendMessage({ chat: { id: this.id } }, msg, parseMode);
    } else if (to === 'polarbears') {
      for (let i = 0; i < this.alivePolarbears.length; i += 1) {
        httpsrequests.sendMessage({ chat: { id: this.players[this.alivePolarbears[i].name].id } }, msg, parseMode);
      }
    } else if (to === 'littleGirl') {
      // send to user.teleID
      httpsrequests.sendMessage({ chat: { id: this.players[this.littleGirl].id } }, msg, parseMode);
    } else if (to === 'doctor') {
      // send to user.teleID
      httpsrequests.sendMessage({ chat: { id: this.players[this.doctor].id } }, msg, parseMode);
    }
  }
};

module.exports.createReplyKeyboardMarkup = createReplyKeyboardMarkup;
module.exports.sendMessage = sendMessage;
