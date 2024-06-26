const { WebSocketServer } = require('ws');
const uuid = require('uuid');

function peerProxy(httpServer) {
  // Create a websocket object
  const wss = new WebSocketServer({ noServer: true });
  // Keep track of all the connections
  let connections = [];

  // Broadcast the user count to all connected clients
  function broadcastUsers() {
    const usernames = connections.filter(c => c.username).map(c => c.username);
    wss.clients.forEach(function each(client) {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'userList', count: wss.clients.size, usernames }));
      }
    });
  }

  function broadcastSharedEvents(date) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'sharedCalendarUpdated', date: date }));
      }
    });
  }


  // Handle the protocol upgrade from HTTP to WebSocket
  httpServer.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
      console.log('WebSocket connection established', request.url);
    });
  });


  wss.on('connection', (ws) => {
    const connection = { id: uuid.v4(), alive: true, ws: ws };
    connections.push(connection);
    broadcastUsers();
    console.log('WebSocket connection established', connections.length, 'clients connected')

    ws.on('message', async (message) => {
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message);
      } catch (error) {
        console.error('Error parsing message', error);
        return;
      }

      if (parsedMessage.type === 'sharedCalendarUpdated') {
        try {
          // read the date from the message
          const date = parsedMessage.date;
          broadcastSharedEvents(date);
        } catch (error) {
          console.error('Database operation failed', error);
        }
      } else {
        const pos = connections.findIndex((o) => o.id === connection.id);
        if (pos !== -1) {
          connections[pos].username = parsedMessage.username;
          broadcastUsers();
        }
      }
    });



    // Remove the closed connection so we don't try to forward anymore
    ws.on('close', () => {
      const pos = connections.findIndex((o, i) => o.id === connection.id);

      if (pos >= 0) {
        connections.splice(pos, 1);
      }
      broadcastUsers();
    });

    // Respond to pong messages by marking the connection alive
    ws.on('pong', () => {
      connection.alive = true;
    });
  });

  // Keep active connections alive
  setInterval(() => {
    connections.forEach((c) => {
      // Kill any connection that didn't respond to the ping last time
      if (!c.alive) {
        c.ws.terminate();
      } else {
        c.alive = false;
        c.ws.ping();
      }
    });
    broadcastUsers();
  }, 10000);
}

module.exports = { peerProxy };
