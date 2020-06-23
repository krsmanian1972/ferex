import 'dotenv/config';

const express = require('express');
const https = require('https');
const cors = require('cors');
const signalServer = require('./signalServer');
const constants = require('crypto').constants;
const crypto = require('crypto');
const fs = require('fs');
const bind_port = process.env.port;
const app = express();
app.use(cors());

const options = {
  //key: fs.readFileSync('/root/cert/server.key'),
  //cert: fs.readFileSync('/root/cert/server.crt'),
  pfx:fs.readFileSync('/root/cert/server.pfx'),
  passphrase: 'harini2001',
  ca:[
   fs.readFileSync('/root/cert/rootCA.pem'),
  ],
  //requestCert: false,
  //rejectUnauthorized: false,
  //secureOptions: constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_TLSv1 //| constants.SSL_OP_NO_TLSv1_1
}

const server = https.createServer(options, app);

app.get("/",(req,res) => {
        res.send("This is a signalling server for Ferri-UI.");
});

server.listen(bind_port, ()=>{
	signalServer(server);
	console.log('App is started and listening at '+bind_port);
});
