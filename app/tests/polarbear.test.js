const test = require('tape');
const PolarbearSession = require('../server/modules/polarbearSession');

const gameSession = new PolarbearSession(1);
gameSession.isTest = true;
test('Creating a game session', (assert) => {
  assert.equal(gameSession.id, 1,
    'should have an id of 1');
  assert.end();
});

test('Simulating 5 players joining the session', (assert) => {
  // add at least 5 players
  gameSession.joinGame('player1');
  gameSession.joinGame('player2');
  gameSession.joinGame('player3');
  gameSession.joinGame('player4');
  gameSession.joinGame('player5');
  assert.equal(gameSession.playerNameList.length, 5, 'number of players is 5');
  assert.equal(gameSession.players.player1.name, 'player1', 'player should have name player1');
  assert.equal(gameSession.players.player2.name, 'player2', 'player should have name player2');
  assert.equal(gameSession.players.player3.name, 'player3', 'player should have name player3');
  assert.equal(gameSession.players.player4.name, 'player4', 'player should have name player4');
  assert.equal(gameSession.players.player5.name, 'player5', 'player should have name player5');
  assert.end();
});

test('Assigning of roles', (assert) => {
  gameSession.startGame();
  assert.notEqual(gameSession.players.player1.role, '', `player1 has a role of: ${gameSession.players.player1.role}`);
  assert.notEqual(gameSession.players.player2.role, '', `player2 has a role of: ${gameSession.players.player2.role}`);
  assert.notEqual(gameSession.players.player3.role, '', `player3 has a role of: ${gameSession.players.player3.role}`);
  assert.notEqual(gameSession.players.player4.role, '', `player4 has a role of: ${gameSession.players.player4.role}`);
  assert.notEqual(gameSession.players.player5.role, '', `player5 has a role of: ${gameSession.players.player5.role}`);
  assert.equal(gameSession.lovers.length, 2, `lovers have been assigned: ${JSON.stringify(gameSession.lovers[0])} ${JSON.stringify(gameSession.lovers[1])}`);
  if (gameSession.players[gameSession.lovers[0]].faction !== gameSession.players[gameSession.lovers[1]].faction) {
    assert.equal(gameSession.mixLovers, true, 'there are lovers from different factions');
  } else {
    assert.equal(gameSession.mixLovers, false, 'there are no lovers from different factions');
  }
  assert.equal(gameSession.players[gameSession.lovers[0]].lover, gameSession.players[gameSession.lovers[1]], 'lover 1 is linked to lover 2');
  assert.equal(gameSession.players[gameSession.lovers[1]].lover, gameSession.players[gameSession.lovers[0]], 'lover 2 is linked to lover 1');
  assert.end();
});
