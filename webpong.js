/**
 * Created by josh on 23/07/15.
 */
if (typeof exports !== "undefined") {
    var Phys = require("./Phys.js");
}
(function(exports){

    function Player(context, board, xpos) {
        this.board = board;
        this.context = context;
        this.paddle_x = xpos;
        this.paddle_y = this.board.height / 2;
        this.velo_y = 0;
        this.score = 0;
        this.paddle_height = 50;
        this.paddle_width = 10;
        this.convexHull = undefined;
        this.createConvexHull();
        this.convexHull.setTransform(new Phys.Transform(
            new Phys.Vec2d(this.paddle_x,this.paddle_y),
            new Phys.Vec2d(1,1),
            0));
    }
    exports.Player = Player;

    Player.prototype.update = function (delta_time) {
        this.paddle_y += this.velo_y * delta_time;
        if ((this.paddle_y-this.paddle_height/2) < 0) {
            this.paddle_y = this.paddle_height/2
        } else if ((this.paddle_y+this.paddle_height/2) > this.board.height) {
            console.log("ouside range");
            this.paddle_y = this.board.height-this.paddle_height/2
        }
        this.convexHull.setTransform(new Phys.Transform(
            new Phys.Vec2d(this.paddle_x, this.paddle_y),
            new Phys.Vec2d(1, 1),
            0));
    };

    Player.prototype.render = function () {
        this.convexHull.render(this.context);
    };

    Player.prototype.createConvexHull = function () {
        this.convexHull = new Phys.ConvexHull([
            new Phys.Vec2d(-this.paddle_width/2, -this.paddle_height/2),
            new Phys.Vec2d( this.paddle_width/2, -this.paddle_height/2),
            new Phys.Vec2d( this.paddle_width/2+2,  0),
            new Phys.Vec2d( this.paddle_width/2,  this.paddle_height/2),
            new Phys.Vec2d(-this.paddle_width/2,  this.paddle_height/2),
            new Phys.Vec2d(-this.paddle_width/2-2,  0)
        ]);
    };

    function Ball(context, board, player1, player2) {
        this.context = context;
        this.board = board;
        this.player1 = player1;
        this.player2 = player2;
        this.pos_x = this.board.width / 2;
        this.pos_y = this.board.height / 2;
        this.radius = 10;
        this.velo_x = 100;
        this.velo_y = 0;
    }
    exports.Ball = Ball;

    Ball.prototype.getCircle = function () {
        return new Phys.Circle(new Phys.Vec2d(this.pos_x, this.pos_y), this.radius);
    };

    Ball.prototype.update = function (delta_time) {
        this.pos_x += this.velo_x * delta_time;
        this.pos_y += this.velo_y * delta_time;

        /* Physics pipeline
            1. Backup position so no longer intersecting the object
                (Kinda cheating, just moving the object along the line of intersection not velocity).
            2. Calculate the reflected velocity
            3. Move the amount the object was backed up along the new velocity

            Note:   Ideally this would be applied to the closest intersecting object.
                    This if there is still an intersection this would be repeated until there is no longer
                    collision (maybe an edge case which could cause the algorithm to get stuck).

         */

        var circle = this.getCircle();
        var intersect_p1 = circle.intersects(this.player1.convexHull);
        if (intersect_p1.intersects) {
            console.log("Intersecting player 1!");
            var velo = new Phys.Vec2d(this.velo_x, this.velo_y);
            var pos = new Phys.Vec2d(this.pos_x, this.pos_y);
            pos = pos.sub(intersect_p1.overlap);
            velo = velo.reflect(intersect_p1.overlap);
            this.pos_x = pos.x;
            this.pos_y = pos.y;
            this.velo_x = velo.x;
            this.velo_y = velo.y;
        }

        var intersect_p2 = circle.intersects(this.player2.convexHull);
        if (intersect_p2.intersects) {
            console.log("Intersecting player 2!");
            var velo = new Phys.Vec2d(this.velo_x, this.velo_y);
            var pos = new Phys.Vec2d(this.pos_x, this.pos_y);
            pos = pos.sub(intersect_p2.overlap);
            velo = velo.reflect(intersect_p2.overlap);
            this.pos_x = pos.x;
            this.pos_y = pos.y;
            this.velo_x = velo.x;
            this.velo_y = velo.y;
        }

        //Collision Left
        if ((this.pos_x - this.radius) < 0 ) {
            this.velo_x = -this.velo_x;
            this.pos_x -= (this.pos_x - this.radius);
        }
        //Collision Right
        else if ((this.pos_x + this.radius) > this.board.width ) {
            this.velo_x = -this.velo_x;
            this.pos_x -= ((this.pos_x + this.radius) - this.board.width);
        }

        //Collision Top
        if ((this.pos_y - this.radius) < 0 ) {
            this.velo_y = -this.velo_y;
            this.pos_y -= (this.pos_y - this.radius);
        }
        //Collision Bottom
        else if ((this.pos_y + this.radius) > this.board.height ) {
            this.velo_y = -this.velo_y;
            this.pos_y -= ((this.pos_y + this.radius) - this.board.height);
        }
    };

    Ball.prototype.render = function () {
        this.context.beginPath();
        this.context.arc(this.pos_x, this.pos_y, this.radius, 0, 2*Math.PI);
        this.context.stroke();
    };

    function Board(context, width, height) {
		this.context = context;
        this.width = width;
        this.height = height;
    }
    exports.Board = Board;
    
    Board.prototype.render = function () {
        var lingrad = this.context.createLinearGradient(0,0,this.width,0);
        lingrad.addColorStop(0, '#FFDDDD');
        //lingrad.addColorStop(0.3, '#661111');
        //lingrad.addColorStop(0.7, '#111166');
        lingrad.addColorStop(1, '#DDDDFF');
        this.context.fillStyle = lingrad;
        this.context.fillRect(0,0,this.width,this.height);
    };


    function WebPong(canvas) {
        this.headless = false;
        this.canvas = undefined;
        this.context = undefined;
        if (canvas) {
            this.canvas = canvas;
            this.context = this.canvas.getContext("2d");
            this.canvas.width  = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            this.headless = true;
        }
        this.GameStates = {waiting: 0, countDown: 1, ingame: 2, paused: 3, gameOver: 4};
        this.gameState = this.GameStates.waiting;
        this.timer = 0;
        this.message = "";

        this.board = new Board(this.context, 900,300)
        this.player1 = new Player(this.context, this.board, 20);
        this.player2 = new Player(this.context, this.board, 880);
        this.ball = new Ball(this.context, this.board, this.player1, this.player2);

        this.last_time = new Date().getTime();
        console.log(this.last_time);
    }
    exports.WebPong = WebPong;

    WebPong.prototype.start = function () {
		this.gameState = this.GameStates.waiting;
        this.run();
    };
    
     WebPong.prototype.startMatch = function () {
		this.board = new Board(this.context, 900,300)
        this.player1 = new Player(this.context, this.board, 20);
        this.player2 = new Player(this.context, this.board, 880);
        this.ball = new Ball(this.context, this.board, this.player1, this.player2);
        
        this.gameState = this.GameStates.countDown;
        this.timer = 5;
        var self = this;
        /*
        setTimeout( function () {
			console.log(this, self, self.timer);
			if (self.timer <= 0) {
				self.gameState = self.GameStates.running;
				self.message = "";
			} else {
				self.message = self.timer;
				setTimeout(self.countDown, 1000);
			}},
			1000);*/
		setTimeout( function () {self.countDown()},
			1000);
	 }
    
    
    WebPong.prototype.countDown = function () {
		if (this.timer <= 0) {
			this.gameState = this.GameStates.running;
			this.message = "";
		} else {
			this.timer -= 1;
			this.message = this.timer;
			var self = this;
			setTimeout(function () {self.countDown()}, 1000);
		}
	}
	
	WebPong.prototype.renderText = function(text, x, y) {
		this.context.fillStyle = "black";
		this.context.font="50px Georgia";
		this.context.textAlign="center";
		this.context.fillText(text,x,y);
	}

    WebPong.prototype.run = function () {
        var current_time = new Date().getTime();
        var delta_time = (current_time - this.last_time) / 1000;

		switch (this.gameState) {
		case this.GameStates.waiting:
			break;
		case this.GameStates.countDown:
			this.player1.update(delta_time);
			this.player2.update(delta_time);
			break;
		case this.GameStates.running:
			this.player1.update(delta_time);
			this.player2.update(delta_time);
			this.ball.update(delta_time);
			break;
		case this.GameStates.paused:
			break;
		case this.GameStates.endGame:
			break;
		}
        
        if (!this.headless) {
			//Render Game Layer
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
				this.context.save();
				this.context.scale(this.canvas.width / this.board.width, this.canvas.height / this.board.height);
				this.board.render();
				this.player1.render();
				this.player2.render();
				this.ball.render();
			this.context.restore();
			
			//Render Gui Layer
			this.renderText("Waiting for game to start", this.canvas.width / 2, this.canvas.height / 2 - 50)
			
			this.renderText(this.player1.score, 50, this.canvas.height - 50)
			this.renderText(this.player2.score, this.canvas.width - 50, this.canvas.height - 50)
			
			this.renderText(this.message, this.canvas.width / 2, this.canvas.height / 2 + 50)
		}

        this.last_time = current_time;

        var self = this;
        setTimeout(function(){self.run();}, 1000/60);

    };

    WebPong.prototype.update = function (state) {
		this.gameState = state.game.gameState;
		this.timer = state.game.timer;
		this.message = state.game.message;
		
        this.player1.paddle_x = state.player1.paddle_x;
        this.player1.paddle_y = state.player1.paddle_y;
        this.player1.paddle_height = state.player1.paddle_height;
        this.player1.paddle_width = state.player1.paddle_width;
        this.player1.velo_y = state.player1.velo_y;
        this.player1.score = state.player1.score;

        this.player2.paddle_x = state.player2.paddle_x;
        this.player2.paddle_y = state.player2.paddle_y;
        this.player2.paddle_height = state.player2.paddle_height;
        this.player2.paddle_width = state.player2.paddle_width;
        this.player2.velo_y = state.player2.velo_y;
        this.player2.score = state.player2.score;

        this.ball.pos_x = state.ball.pos_x;
        this.ball.pos_y = state.ball.pos_y;
        this.ball.radius = state.ball.radius;
        this.ball.velo_x = state.ball.velo_x;
        this.ball.velo_y = state.ball.velo_y;
    };

    WebPong.prototype.getState = function () {
        var state = {
			game: {
				gameState: this.gameState,
				timer: this.timer,
				message: this.message
			},
            player1: {
                paddle_x: this.player1.paddle_x,
                paddle_y: this.player1.paddle_y,
                paddle_height: this.player1.paddle_height,
                paddle_width: this.player1.paddle_width,
                velo_y: this.player1.velo_y,
                score: this.player1.score
            },
            player2: {
                paddle_x: this.player2.paddle_x,
                paddle_y: this.player2.paddle_y,
                paddle_height: this.player2.paddle_height,
                paddle_width: this.player2.paddle_width,
                velo_y: this.player2.velo_y,
                score: this.player1.score
            },
            ball: {
                pos_x: this.ball.pos_x,
                pos_y: this.ball.pos_y,
                radius: this.ball.radius,
                velo_x: this.ball.velo_x,
                velo_y: this.ball.velo_y,
            }
        };
        return state;
    };
})(typeof exports === 'undefined'? this['WebPong']={}: exports);
