/**
 * Created by josh on 23/07/15.
 */

function Client () {
    this.ws = new WebSocket("ws://localhost:8080", "webpong-stream");
    var self = this;

    this.ws.onmessage = function (event) {
        console.log(event.data);
    }
}
