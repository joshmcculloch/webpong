#!/usr/bin/env nodejs
var WebSocketServer = require('websocket').server;
var http = require('http');
var WebPong = require("./webpong.js");

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
				console.log("Added "+data.name+" to queue");
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
	this.serverStates = {waiting2players: 0, waiting1players: 1, ingame: 2, gameOver: 3};
    this.serverState = this.serverStates.waiting2players;
    this.clients = [];
    this.playerQueue = [];
    this.game = game;
    this.game.message = "Waiting for players"
    
    self = this;
    setInterval(function () {
		console.log(self.serverState, self.playerQueue.length);
		switch (self.serverState) {
		
		case self.serverStates.waiting2players:
			if (self.playerQueue.length > 0) {
				self.serverState = self.serverStates.waiting1players;
				self.game.message = "Waiting for one more player";
			}
			break
		
		case self.serverStates.waiting1players:
			if (self.playerQueue.length > 1) {
				console.log("starting game");
				self.serverState = self.serverStates.ingame;
				self.game.message = "Starting Game";
				self.game.startMatch();
			}
			else if (self.playerQueue.length < 1) {
				self.serverState = self.serverStates.waiting2players;
				self.game.message = "Waiting for players"
			}
			break
		
		case self.serverStates.ingame:
			if (self.game.gameState == self.game.GameStates.gameOver) {
				self.serverState = self.serverStates.gameOver;
			}
			break
		
		case self.serverStates.gameOver:
			self.serverState = self.serverStates.waiting1players;
			self.game.message = "Waiting for players";
			break
		}
		self.sendUpdate();
	}, 500)
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

var webPong = new WebPong.WebPong();
webPong.start();
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
