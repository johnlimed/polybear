const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const rethink = require('./server/modules/rethink');
const http = require('http');
const https = require('https');
const teleConfig = require('./server/config/telegramConfig');
const request = require('request');
const certificates = require('./server/config/certificates');
// const querystring = require('querystring');
// const expressJWT = require('express-jwt');

const app = express();
const port = {
	http: process.env.HTTP_PORT || 3000,
	https: process.env.HTTPS_PORT || 4333,
};

const privateKey = certificates.privateKey;
const certificate = certificates.certificate;
const cACertificate = certificates.cACertificate;

// const serverSecret = 'my super awesome tele bot';

setupWebhook = () => {
	console.log('Setting up telegram webhook!');
	const payload = { url: `https://91757956.ngrok.io/webhook/${teleConfig.token}` };
	// const manualOptions = {
	// 	hostname: 'api.telegram.org',
	// 	port: 443,
	// 	path: encodeURI(`/bot${teleConfig.token}/setWebhook`),
	// 	url: `https://0110587d.ngrok.io/webhook/${teleConfig.token}`,
	// 	method: 'POST',
	// 	headers: {
	// 		'Content-Type': 'application/json',
	// 		'Content-Length': Buffer.byteLength(payload),
	// 	}
	// };
	const options = {
		method: 'POST',
		uri: `https://api.telegram.org/bot${teleConfig.token}/setWebhook`,
		json: payload,
		// url: `https://api.telegram.org/bot${teleConfig.token}/setWebhook`,
		agentOptions: {
				cert: certificate,
				key: privateKey,
				// Or use `pfx` property replacing `cert` and `key` when using private key, certificate and CA certs in PFX or PKCS12 format:
				// pfx: fs.readFileSync(pfxFilePath),
				// passphrase: 'password',
				// securityOptions: 'SSL_OP_NO_SSLv3'
		}
	};

	// const httpRequest = https.request(options, (httpRes) => {
	// 	console.log('statusCode:', httpRes.statusCode);
	// 	console.log('headers:', httpRes.headers);
	// 	httpRes.setEncoding('utf8');
	// 	httpRes.on('data', (d) => {
	// 		process.stdout.write(d);
	// 	});
	// 	httpRes.on('end', () => {
	// 		console.log('No more data in response.');
	// 	});
	// });
	// httpRequest.on('error', (err) => {
	// 	console.log(err);
	// });
	// httpRequest.write(payload);
	// httpRequest.end();

	request(options, (err, res, body) => {
		if (err) {
			console.log('there was an error with the request ', err);
		} else {
			console.log('successfully setup webhook!');
			// console.log('success! ', body);
		}
	});
};

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

			setupWebhook();
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

// use jwt tokens
// app.use(expressJWT({ secret: serverSecret }).unless({ path: ['/register', '/login', '/'] }));

// set static files
app.use('/', express.static(path.join(__dirname, 'public')));

// const authRoute	= require('./server/routes/auth');
const route = require('./server/routes/router');

// app.use('/', authRoute);
app.use('/', route); // last to capture all other routes to the frontend

runServer(app);

module.exports = app;
