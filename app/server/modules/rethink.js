const rethink = require('rethinkdb');
const dbconfig = require('../config/dbconfig');

// connect to rethinkdb
const listTable = [
	'users',
	'rooms',
	'webhook',
];

runRethink = () => new Promise((resolve, reject) => {
  rethink.connect(dbconfig[process.env.NODE_ENV], (err, conn) => {
    if (err) {
      console.log('Could not open a connection to initialize the database');
      console.log(err.message);
			conn.close();
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
            rethink.db(dbconfig.dev.db).tableCreate(listTable[i]).run(conn, (createErr, createRes) => {
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

module.exports.runRethink = runRethink;
