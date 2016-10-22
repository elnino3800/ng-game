#!/usr/bin/env node
var express = require('express'),
    path = require('path');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

server.listen(port, server_ip_address, function () {
    console.log("Listening on " + server_ip_address + ", port " + port)
});

var staticPath = path.join(__dirname, '../client/production');
if (process.env.NODE_ENV !== "production") {
    staticPath = path.join(__dirname, '../client/dist')
}

app.use(express.static(staticPath, {maxAge: 86400000}));

app.get('/', function (req, res) {
    res.sendfile(path.join(staticPath, 'index.html'));
});

require('./routes/io.js')(app, io);
