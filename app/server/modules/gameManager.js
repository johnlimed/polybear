module.exports = function GameManager() {
  const gameList = [];
  // this.register
  // this.gameList
  // this.joinGame = () =>
  this.newGame = (roomID) => {
    gameList.push(roomID);
  };
};
