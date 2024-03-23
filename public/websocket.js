var ws = new WebSocket("ws://" + window.location.host + "/path");
ws.onopen = function () {
    console.log("Connected to WebSocket");
    ws.send("Hello, server!");
};
ws.onmessage = function (event) {
    console.log("Message from server:", event.data);
    const message = JSON.parse(event.data);
    if (message.type === 'userCount') {
        document.getElementById('userCount').textContent = message.count;
    }
};