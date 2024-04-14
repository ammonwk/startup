const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('rm_data');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const cookieParser = require('cookie-parser');
const { peerProxy } = require('./peerProxy.js');

// Connect to the database
(async function testConnection() {
    await client.connect();
    await db.command({ ping: 1 });
    console.log('Connected to database', db.databaseName);
})().catch((ex) => {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
});

async function createUser(username, password) {
    // Hash the password before we insert it into the database
    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
        username: username,
        password: passwordHash,
        token: uuid.v4(),
    };
    await db.collection('users').insertOne(user);

    return user;
}


// The service port. In production the front-end code is statically hosted by the service on the same port.
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// Middleware - Static file hosting
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve the public directory as static files
app.use(cookieParser()); // Parse cookies

// Router for service endpoints
var apiRouter = express.Router();
app.use(`/api`, apiRouter);

apiRouter.post('/login', async (req, res) => {
    // handle empty input
    if (!req.body.username || !req.body.password) {
        res.status(400).send({ msg: 'Please enter username and password' });
        return;
    }
    const user = await db.collection('users').findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        res.cookie("token", user.token, {
            secure: true,
            httpOnly: true,
            sameSite: 'strict',
        });
        res.send({ id: user._id });
    } else {
        res.status(401).send({ msg: 'Invalid username or password' });
    }
});

apiRouter.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.collection('users').findOne({ username: username });
    if (user) {
        res.status(409).send({ msg: 'Username taken' });
    } else {
        const user = await createUser(req.body.username, req.body.password);
        res.cookie("token", user.token, {
            secure: true,
            httpOnly: true,
            sameSite: 'strict',
        });
        res.send({
            id: user._id,
        });
    }
});

// Get and set events for the user
apiRouter.get('/events', async (req, res) => {
    const token = req.cookies.token;
    const user = await db.collection('users').findOne({ token: token });
    if (user) {
        const date = req.query.date; // Get the date from the query parameter
        // Find the events document for this user and date
        const userEvents = await db.collection('events').findOne({ userId: user._id, date: date });
        // If the document exists, send it; otherwise, send an empty object
        res.send(userEvents ? userEvents.events : {});
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

apiRouter.post('/events', async (req, res) => {
    const token = req.cookies.token;
    const user = await db.collection('users').findOne({ token: token });
    if (user) {
        const date = req.query.date; // Get the date from the query parameter
        const events = req.body;
        // Update or insert the events document for this user and date
        await db.collection('events').updateOne(
            { userId: user._id, date: date },
            { $set: { events: events, userId: user._id, date: date } },
            { upsert: true }
        );
        res.send(events);
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

apiRouter.get('/settings', async (req, res) => {
    const token = req.cookies.token;
    const user = await db.collection('users').findOne({ token: token });
    if (user) {
        const settings = await db.collection('settings').findOne({ userId: user._id });
        res.send(settings ? settings : {});
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

apiRouter.post('/settings', async (req, res) => {
    const token = req.cookies.token;
    const user = await db.collection('users').findOne({ token: token });
    if (user) {
        const newSettings = req.body;
        await db.collection('settings').updateOne(
            { userId: user._id },
            { $set: newSettings },
            { upsert: true }
        );
        res.send(newSettings);
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

// Get and set shared events
apiRouter.get('/shared-events', async (req, res) => {
    const date = req.query.date;
    const sharedEvents = await db.collection('sharedEvents').findOne({ date: date });
    res.send(sharedEvents ? sharedEvents.events : {});
});

apiRouter.post('/shared-events', async (req, res) => {
    const date = req.query.date;
    const events = req.body;
    await db.collection('sharedEvents').updateOne(
        { date: date },
        { $set: { events: events, date: date } },
        { upsert: true }
    );
    res.send(events);
});

app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).send('Something broke!'); // Send a generic error message
});

// secureApiRouter verifies credentials for endpoints
var secureApiRouter = express.Router();
apiRouter.use(secureApiRouter);

secureApiRouter.use(async (req, res, next) => {
    authToken = req.cookies[authCookieName];
    const user = await db.collection('users').findOne({ token: token });
    if (user) {
        next();
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});


// Return the application's default page if the path is unknown
app.use((_req, res) => {
    console.log('Unknown path.', _req.path, 'Sending index.html...');
    res.sendFile('index.html', { root: 'public' });
});

const httpService = app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
peerProxy(httpService);