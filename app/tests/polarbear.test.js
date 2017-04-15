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
  gameSession.assignRoles();
  assert.notEqual(gameSession.players.player1.role, '', `player1 has a role of: ${gameSession.players.player1.role}`);
  assert.notEqual(gameSession.players.player2.role, '', `player2 has a role of: ${gameSession.players.player2.role}`);
  assert.notEqual(gameSession.players.player3.role, '', `player3 has a role of: ${gameSession.players.player3.role}`);
  assert.notEqual(gameSession.players.player4.role, '', `player4 has a role of: ${gameSession.players.player4.role}`);
  assert.notEqual(gameSession.players.player5.role, '', `player5 has a role of: ${gameSession.players.player5.role}`);
  assert.equal(gameSession.lovers.length, 2, `lovers have been assigned: ${JSON.stringify(gameSession.lovers[0])} ${JSON.stringify(gameSession.lovers[1])}`);
  assert.equal(gameSession.players[gameSession.lovers[0]].lover, gameSession.players[gameSession.lovers[1]].name, 'lover 1 is linked to lover 2');
  assert.equal(gameSession.players[gameSession.lovers[1]].lover, gameSession.players[gameSession.lovers[0]].name, 'lover 2 is linked to lover 1');
  if (gameSession.players[gameSession.lovers[0]].faction === 'Lovers' && gameSession.players[gameSession.lovers[1]].faction === 'Lovers') {
    assert.equal(gameSession.mixLovers, true, 'lovers are from different factions');
    assert.equal(gameSession.aliveVillagers.length, gameSession.numVillagers - 1, `number of villagers should be -1 of total villagers: ${gameSession.numVillagers}`);
    assert.equal(gameSession.alivePolarbears.length, gameSession.numPolarbears - 1, `number of polarbears should be -1 of total polarbears: ${gameSession.numPolarbears}`);
  } else {
    assert.equal(gameSession.mixLovers, false, `lovers are from same factions: ${gameSession.players[gameSession.lovers[1]].faction}`);
    assert.equal(gameSession[`alive${gameSession.players[gameSession.lovers[1]].faction}`].length, gameSession[`num${gameSession.players[gameSession.lovers[1]].faction}`], `number of ${gameSession.players[gameSession.lovers[1]].faction} should be same as total: ${gameSession[`num${gameSession.players[gameSession.lovers[1]].faction}`]}`);
  }
  assert.equal(gameSession.loversAlive, true, 'loversAlive has been set to true');
  assert.end();
});

test('Eliminating player 1', (assert) => {
  gameSession.eliminatePlayer('player1');
  assert.equal(gameSession.players.player1.status, 'dead', 'player1\'s status should be dead');
  if (gameSession.players.player1.isLover) {
    assert.equal(gameSession.players[gameSession.players.player1.lover].status, 'dead', 'player1\'s lover status should be dead too');
    assert.equal(gameSession.aliveLovers.length, 0, 'number of alive lovers should be 0');
    if (gameSession.players.player1.faction === 'Villagers') {
      assert.equal(gameSession.numVillagers - 2, gameSession.aliveVillagers.length, `lovers from the village.. number of alive villagers should be -2 total numVillagers: ${gameSession.numVillagers}`);
    } else if (gameSession.mixLovers) {
      assert.equal(gameSession.numVillagers - 1, gameSession.aliveVillagers.length, `mix lovers.. number of alive villagers should be -1 total numVillagers: ${gameSession.numVillagers}`);
      assert.equal(gameSession.numPolarbears - 1, gameSession.alivePolarbears.length, `mix lovers.. number of alive polarbears should be -1 total numPolarbears: ${gameSession.numPolarbears}`);
    } else {
      assert.equal(gameSession.numPolarbears - 2, gameSession.alivePolarbears.length, `number of alive polarbears should be -2 of total: ${gameSession.numPolarbears}`);
    }
  } else {
     if (gameSession.players.player1.faction === 'Villagers' && gameSession.mixLovers) {
       assert.equal(gameSession.numVillagers - 2, gameSession.aliveVillagers.length, `player 1 is a villager and not in love.. but there are mix lovers... number of alive villagers should be -2 total numVillagers: ${gameSession.numVillagers}`);
     } else if (gameSession.players.player1.faction === 'Villagers') {
       assert.equal(gameSession.numVillagers - 1, gameSession.aliveVillagers.length, `player 1 is a villager and not in love.. number of alive villagers should be -1 total numVillagers: ${gameSession.numVillagers}`);
     } else if (gameSession.players.player1.faction === 'Polarbears' && gameSession.mixLovers) {
       assert.equal(gameSession.numPolarbears - 1, gameSession.alivePolarbears.length, `player 1 is a polarbear and not in love.. but there are mix lovers... number of alive polarbears should be -2 total numVillagers: ${gameSession.numVillagers}`);
     } else {
       assert.equal(gameSession.numPolarbears - 1, gameSession.alivePolarbears.length, `player 1 is a polarbear and not in love..number of alive polarbears should be -1 of total: ${gameSession.numPolarbears}`);
     }
    assert.equal(gameSession.aliveLovers.length, 2, 'number of alive lovers should be 2');
  }
  assert.end();
});

test('Check for a winner', async (assert) => {
  const winner = await gameSession.checkForWinner();
  const loversAlive = (gameSession.mixLovers && gameSession.loversAlive);
  const polarbearsAlive = gameSession.alivePolarbears.length > 0;
  const villagersAlive = gameSession.aliveVillagers.length > 0;
  if (loversAlive && !polarbearsAlive && !villagersAlive) {
    assert.equal(winner, 'Lovers', 'Lovers should have won');
    // TODO: need to skip to end game test
  } else if (polarbearsAlive && !loversAlive && !villagersAlive) {
    assert.equal(winner, 'Polarbears', 'Polarbears should have won');
    // TODO: need to skip to end game test
  } else if (villagersAlive && !loversAlive && !polarbearsAlive) {
    assert.equal(winner, 'Villagers', 'Villagers should have won');
    // TODO: need to skip to end game test
  } else {
    assert.equal(winner, 'no winner', 'there should be no winner');
  }
  assert.end();
});

// TODO: test polarbear phase function

// TODO: test little girl phase function
// TODO: test doctor phase function
// TODO: test villagers phase function
