const test = require('tape');
const PolarbearSession = require('../server/modules/polarbearSession');

test('Creating a player', (assert) => {
  const gameSession = new PolarbearSession(1);
  assert.equal(gameSession.id, 1,
    'should have the id of 1');
  assert.end();
});

test('Assigning of roles', (assert) => {
  const gameSession = new PolarbearSession(1);
  gameSession.isTest = true;
  // add at least 5 players
  gameSession.joinGame('player1');
  gameSession.joinGame('player2');
  gameSession.joinGame('player3');
  gameSession.joinGame('player4');
  gameSession.joinGame('player5');
  gameSession.startGame();
  assert.notEqual(gameSession.players.player1.role, '',
    `player1 has a role of: ${gameSession.players.player1.role}`);
  assert.notEqual(gameSession.players.player2.role, '',
    `player2 has a role of: ${gameSession.players.player2.role}`);
  assert.notEqual(gameSession.players.player3.role, '',
    `player3 has a role of: ${gameSession.players.player3.role}`);
  assert.notEqual(gameSession.players.player4.role, '',
    `player4 has a role of: ${gameSession.players.player4.role}`);
  assert.notEqual(gameSession.players.player5.role, '',
    `player5 has a role of: ${gameSession.players.player5.role}`);
  assert.end();
});
