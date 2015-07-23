/**
 * Created by josh on 23/07/15.
 */
(function(exports){

    function Player(context, board, xpos) {
        this.board = board;
        this.context = context;
        this.paddle_x = xpos;
        this.paddle_y = this.board.height / 2;
        this.paddle_height = 50;
        this.paddle_width = 10;
    }
    exports.Player = Player;

    Player.prototype.update = function (context) {

    };

    Player.prototype.render = function () {
        this.context.beginPath();
        this.context.rect(this.paddle_x - this.paddle_width/2,
            this.paddle_y - this.paddle_height/2,
            this.paddle_width,
            this.paddle_height);
        this.context.stroke();
    };

    function Ball(context, board) {
        this.context = context;
        this.board = board;
        this.pos_x = this.board.width / 2;
        this.pos_y = this.board.height / 2;
        this.radius = 10;
        this.velo_x = 100;
        this.velo_y = 80;
    }
    exports.Ball = Ball;

    Ball.prototype.update = function (delta_time) {
        this.pos_x += this.velo_x * delta_time;
        this.pos_y += this.velo_y * delta_time;

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

    function Board(width, height) {
        this.width = width;
        this.height = height;
    }
    exports.Board = Board;

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

        this.board = new Board(900,300)
        this.player1 = new Player(this.context, this.board, 20);
        this.player2 = new Player(this.context, this.board, 880);
        this.ball = new Ball(this.context, this.board);

        this.last_time = new Date().getTime();
        console.log(this.last_time);


    }
    exports.WebPong = WebPong;

    WebPong.prototype.start = function () {
        this.run();
    };

    WebPong.prototype.run = function () {
        var current_time = new Date().getTime();
        var delta_time = (current_time - this.last_time) / 1000;

        this.player1.update(delta_time);
        this.player2.update(delta_time);
        this.ball.update(delta_time);

        if (!this.headless) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.save();
                this.context.scale(this.canvas.width / this.board.width, this.canvas.height / this.board.height);
                this.player1.render();
                this.player2.render();
                this.ball.render();
            this.context.restore();
        }

        this.last_time = current_time;

        var self = this;
        setTimeout(function(){self.run();}, 1000/60);

    };

    WebPong.prototype.update = function (state) {
        this.player1.paddle_x = state.player1.paddle_x;
        this.player1.paddle_y = state.player1.paddle_y;
        this.player1.paddle_height = state.player1.paddle_height;
        this.player1.paddle_width = state.player1.paddle_width;

        this.player2.paddle_x = state.player2.paddle_x;
        this.player2.paddle_y = state.player2.paddle_y;
        this.player2.paddle_height = state.player2.paddle_height;
        this.player2.paddle_width = state.player2.paddle_width;

        this.ball.pos_x = state.ball.pos_x;
        this.ball.pos_y = state.ball.pos_y;
        this.ball.radius = state.ball.radius;
        this.ball.velo_x = state.ball.velo_x;
        this.ball.velo_y = state.ball.velo_y;
    };

    WebPong.prototype.getState = function () {
        var state = {
            player1: {
                paddle_x: this.player1.paddle_x,
                paddle_y: this.player1.paddle_y,
                paddle_height: this.player1.paddle_height,
                paddle_width: this.player1.paddle_width
            },
            player2: {
                paddle_x: this.player2.paddle_x,
                paddle_y: this.player2.paddle_y,
                paddle_height: this.player2.paddle_height,
                paddle_width: this.player2.paddle_width
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