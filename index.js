const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('rm_data');

// Connect to the database
(async function testConnection() {
    await client.connect();
    await db.command({ ping: 1 });
    console.log('Connected to database', db.databaseName);
})().catch((ex) => {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
});

// The service port. In production the front-end code is statically hosted by the service on the same port.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// Middleware - Static file hosting
app.use(express.json());
app.use(express.static('public'));

// Router for service endpoints
var apiRouter = express.Router();
app.use(`/api`, apiRouter);

apiRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.collection('users').findOne({ username: username, password: password });
    if (user) {
        res.send({ username: user.username });
    } else {
        res.status(401).send({ msg: 'Invalid username or password' });
        console.log('Invalid username or password');
    }
});

apiRouter.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.collection('users').findOne({ username: username });
    if (user) {
        res.status(409).send({ msg: 'Username already exists' });
        console.log('Username already exists');
    } else {
        await db.collection('users').insertOne({ username: username, password: password });
        res.send({ username: username });
    }
});

// In-memory storage for the events
let events = {};

// Service endpoints
apiRouter.get('/events', (_req, res) => {
    res.send(events);
});

apiRouter.post('/events', (req, res) => {
    events = req.body;
    res.send(events);
});

app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).send('Something broke!'); // Send a generic error message
});


// Return the application's default page if the path is unknown
app.use((_req, res) => {
    console.log('Unknown path.', _req.path, 'Sending index.html...');
    res.sendFile('index.html', { root: 'public' });
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});