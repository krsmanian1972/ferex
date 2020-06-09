import 'dotenv/config';

const express = require('express');
const https = require('http');
const cors = require('cors');
const signalServer = require('./signalServer'); 

const bind_port = process.env.port;
const app = express();
app.use(cors());

app.get("/",(req,res) => {
	res.send("This is a signalling server for Ferri-UI.");
});


const server = https.createServer(app);

server.listen(bind_port, ()=>{
	signalServer(server);
	console.log('App is started and listening at '+bind_port);
});
