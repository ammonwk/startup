var ws = new WebSocket("ws://" + window.location.host + "/path");
ws.onopen = function () {
    console.log("Connected to WebSocket");
    ws.send("Hello, server!");
};
ws.onmessage = function (event) {
    console.log("Received message: " + event.data);
};