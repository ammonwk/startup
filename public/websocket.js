var ws = new WebSocket("ws://" + window.location.host + "/path");
ws.onopen = function () {
    console.log("Connected to WebSocket");
    // Check if a username is stored, otherwise set it to "anonymous"
    const username = localStorage.getItem("userName") || "anonymous";
    ws.send(JSON.stringify({ type: 'setUsername', username: username }));
};
ws.onmessage = function (event) {
    console.log("Message from server:", event.data);
    const message = JSON.parse(event.data);
    if (message.type === 'userList') {
        document.getElementById('userCount').textContent = message.count;
        const userList = document.getElementById('userList');
        userList.innerHTML = ''; // Clear existing list
        message.usernames.forEach(username => {
            const li = document.createElement('li');
            li.textContent = username;
            li.className = 'dropdown-item';
            userList.appendChild(li);
        });
    }
};
