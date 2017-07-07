const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');

// connect to rethinkdb
const listTable = [
	{ tableName: 'users', options: { primaryKey: 'teleID' } },
	{ tableName: 'rooms', options: {} },
	{ tableName: 'webhook', options: {} },
];

runRethink = () => new Promise((resolve, reject) => {
  rethink.connect(dbconfig[process.env.NODE_ENV], (err, conn) => {
    if (err) {
      console.log('Could not open a connection to initialize the database');
      console.log(err.message);
      process.exit(1);
    }
    rethink.tableList().run(conn, (listErr, res) => {
      if (listErr) {
				conn.close();
        reject(listErr);
      }
      if (res.length !== listTable.length) {
        console.log('The database does not have the same number of tables!');
        for (let i = 0; i < listTable.length; i += 1) {
          if (!res.includes(listTable[i])) {
            console.log(`Inserting new table ${listTable[i]} into db`);
            rethink.db(dbconfig.dev.db).tableCreate(listTable[i].tableName, listTable[i].options).run(conn, (createErr, createRes) => {
              if (createErr) {
								conn.close();
                reject(createErr);
              }
              console.log('created new table: ', createRes);
            });
          }
        }
        resolve();
      } else {
        console.log('Rethink DB set up, please proceed!');
        resolve();
      }
    });
  });
});

insertIntoWebhook = webhookObj => new Promise((resolve, reject) => {
	rethink.connect(dbconfig[process.env.NODE_ENV], async (err, conn) => {
		try {
			const result = await rethink.table('webhook').insert(webhookObj, { returnChanges: true }).run(conn);
			conn.close();
			if (result.errors) {
				console.log(`error while trying to insert webhook history into db: ${result.errors}`);
				reject(result.errors);
			}
			console.log('successfully logged webhook');
			resolve();
		} catch (tryErr) {
			console.log(`exception caught while trying to insert webhook history to db: ${tryErr}`);
			reject(tryErr);
		}
	});
});

registerUser = (teleID, name, chatID) => new Promise((resolve, reject) => {
	const sendingBack = {};
	rethink.connect(dbconfig[process.env.NODE_ENV], async (err, conn) => {
		try {
			const result = await rethink.table('users').insert({ teleID, name, chatID }, { returnChanges: true }).run(conn);
			conn.close();
			if (result.errors) {
				console.log('i should be here');
				sendingBack.alreadyRegistered = result.errors;
				resolve(sendingBack);
			} else {
				sendingBack.res = { code: 200, msg: 'OK!' };
				resolve(sendingBack);
			}
		} catch (tryErr) {
			console.log('Error caught in registration of user');
			sendingBack.error = tryErr;
			reject(sendingBack);
		}
	});
});

module.exports.runRethink = runRethink;
module.exports.insertIntoWebhook = insertIntoWebhook;
module.exports.registerUser = registerUser;
