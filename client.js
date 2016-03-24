/**
 * Created by josh on 23/07/15.
 */
if (window.DeviceMotionEvent) {
    console.log("DeviceMotionEvent supported");
}

function Client () {
    this.ws = new WebSocket("ws://localhost:8080", "webpong-stream");
    var self = this;
    
    this.ws.onopen = function (event) {
		self.ws.send(JSON.stringify({queueMe: true, name: "test player"}));
	}

    this.ws.onmessage = function (event) {
        //console.log(event.data);
    }
}

Client.prototype.setVelocity = function (velocity) {
	console.log(velocity);
    this.ws.send(JSON.stringify({update: true, player: 1, velocity: velocity}));
};

function Controller(canvas, client) {
    this.client = client;
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.value = 0
    this.cursor_x = this.canvas.width/2;
    this.cursor_y = this.canvas.height/2;
    this.mouseIsDown = false;

    var self = this;
    canvas.addEventListener("touchstart",
        function (event) {
            event.preventDefault();
            this.value = event.targetTouches[0].pageY-this.canvas.height/2;
            self.cursor_x = e.clientX;
		self.cursor_y = e.clientY;
    }, false);

    this.canvas.onmousedown = function(e){
        self.mouseIsDown = true;
        self.value = e.clientY - self.canvas.height/2;
        client.setVelocity(self.value);
        self.cursor_x = e.clientX;
		self.cursor_y = e.clientY;
    }

    this.canvas.onmouseup = function(e){
        if(self.mouseIsDown) {
            self.mouseIsDown = false;
            self.value = 0;
            client.setVelocity(self.value);
            self.cursor_x = self.canvas.width/2;
			self.cursor_y = self.canvas.height/2;
        }
    }

    this.canvas.onmousemove = function(e){
        if(!self.mouseIsDown) return;
        self.value = e.clientY - self.canvas.height/2;
        client.setVelocity(self.value);
        self.cursor_x = e.clientX;
		self.cursor_y = e.clientY;
        return false;
    }

    this.draw();
}

Controller.prototype.draw = function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.beginPath();
    this.context.arc(this.cursor_x,this.cursor_y, 25,0,2*Math.PI);
    this.context.fillStyle = 'red';
    this.context.fill();

    var self = this;
    setTimeout(function() {self.draw()}, 1000/60);
}
