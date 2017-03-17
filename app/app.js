const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const rethink = require('./server/modules/rethink');

const app = express();
const port = process.env.PORT || 3000;

runServer = async (appServer) => {
	try {
		await rethink.runRethink();
		appServer.listen(port, () => {
			console.log(`Listening on *: ${port}`);
			console.log(`Server is on: ${process.env.NODE_ENV}`)
		});
	} catch (err) {
		console.log('Error caught while trying to run server ', err);
	}
};
// cookie parser modules
app.use(cookieParser());

// bodyparser module
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set static files
app.use('/', express.static(path.join(__dirname, 'public')));

// const authRoute	= require('./server/routes/auth');
const route = require('./server/routes/router');

// app.use('/', authRoute);
app.use('/', route); // last to capture all other routes to the frontend

runServer(app);

module.exports = app;
