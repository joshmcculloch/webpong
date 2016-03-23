#!/usr/bin/env nodejs
var WebSocketServer = require('websocket').server;
var http = require('http');
var WebPong = require("./webpong.js");

var webPong = new WebPong.WebPong();

function Client (conn, clientManager) {
    this.conn = conn;
    this.clientManager = clientManager;
    this.subScribed = false;
    this.name = "";

    var self = this;
    this.conn.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            var data = JSON.parse(message.utf8Data);
            console.log(data);
            if (typeof data.update !== "undefined" &&
                typeof data.player !== "undefined" &&
                typeof data.velocity !== "undefined") {
                if (data.player == 1) {
                    console.log("set ",this.name," velo to ", data.velocity)
                    webPong.player1.velo_y = data.velocity;
                    clientManager.sendUpdate();
                } else if (data.player == 2) {
                    webPong.player2.velo_y = data.velocity;
                    clientManager.sendUpdate();
                }

            } else if (typeof data.subscribe !== "undefined") {
				self.subScribed = true;
				
			} else if (typeof data.queueMe !== "undefined" && 
				typeof data.name !== "undefined") {
				self.name = data.name;
				self.clientManager.queueMe(self);
			}

            //connection.sendUTF( );
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

function ClientManager(game) {
    this.clients = [];
    this.playerQueue = [];
    this.game = game;
}

ClientManager.prototype.addClient = function (client) {
    this.clients.push(client);
};

ClientManager.prototype.queueMe = function (client) {
    this.playerQueue.push(client);
};

ClientManager.prototype.sendUpdate = function () {
    var state = this.game.getState();
    for(var i=0; i<this.clients.length; i ++ ) {
        if (this.clients[i].subScribed) {
            this.clients[i].sendObj(state);
        }
    };
};

ClientManager.prototype.sendMessage = function (text) {

    for(var i=0; i<this.clients.length; i ++ ) {
        this.clients[i].sendObj({message: text});
    };
};


ClientManager.prototype.removeClient = function (client) {
    var index = this.clients.indexOf(client);
    if (index > -1) {
        this.clients.splice(index, 1);
    }
    var index = this.playerQueue.indexOf(client);
    if (index > -1) {
        this.playerQueue.splice(index, 1);
    }
};

var clientManager = new ClientManager(webPong);

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
    clientManager.sendUpdate(); /*
    var state = webPong.getState();
    var clients = clientManager.clients;
    for(var i=0; i<clients.length; i ++ ) {
        if (clients[i].subScribed) {
            clients[i].sendObj(state);
        }
    };*/
}, 500)
