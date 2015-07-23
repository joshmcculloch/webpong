#!/usr/bin/env nodejs
var WebSocketServer = require('websocket').server;
var http = require('http');
var WebPong = require("./webpong.js");

var webPong = new WebPong.WebPong();

function Client (conn, clientManager) {
    this.conn = conn;
    this.clientManager = clientManager;
    this.subScribed = true;

    var self = this;
    this.conn.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF( JSON.parse(message.utf8Data));
        }
    });
    this.conn.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + self.conn.remoteAddress + ' disconnected.');
        self.clientManager.removeClient(self);
    });
}

Client.prototype.sendObj = function (obj) {
    this.conn.sendUTF( JSON.stringify(obj));
};

function ClientManager() {
    this.clients = [];
}

ClientManager.prototype.addClient = function (client) {
    this.clients.push(client);
}

ClientManager.prototype.removeClient = function (client) {
    var index = this.clients.indexOf(client);
    if (index > -1) {
        this.clients.splice(index, 1);
    }
}

var clientManager = new ClientManager();

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    console.log("Origin", origin);
    return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept('webpong-stream', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    clientManager.addClient(new Client(connection,clientManager));
});

webPong.start();

setInterval(function () {
    var state = webPong.getState();
    var clients = clientManager.clients;
    for(var i=0; i<clients.length; i ++ ) {
        if (clients[i].subScribed) {
            clients[i].sendObj(state);
        }
    };
}, 500)