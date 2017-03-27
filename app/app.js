const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const rethink = require('./server/modules/rethink');
const http = require('http');
const https = require('https');
const certificates = require('./server/config/certificates');
const httpsrequests = require('./server/modules/httpsrequests');

const app = express();
const port = {
	http: process.env.HTTP_PORT || 3000,
	https: process.env.HTTPS_PORT || 4333,
};

const privateKey = certificates.privateKey;
const certificate = certificates.certificate;
const cACertificate = certificates.cACertificate;

runServer = async (appServer) => {
	try {
		const options = {
			ca: cACertificate,
			key: privateKey,
			cert: certificate,
		};
		await rethink.runRethink();
		http.createServer(appServer).listen(port.http, () => {
			console.log(`HTTP server listening on *: ${port.http}`);
		});
		https.createServer(options, appServer).listen(port.https, () => {
			console.log(`HTTPS server listening on *: ${port.https}`);
			console.log(`Server is on: ${process.env.NODE_ENV}`);

			httpsrequests.setupWebhook();
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

app.use('/', route); // last to capture all other routes to the frontend

runServer(app);

module.exports = app;
