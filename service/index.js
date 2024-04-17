const express = require('express');
const compression = require('compression');
const app = express();

app.use(compression({ level: 6 }));

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

    // Create indexes
    await db.collection('events').createIndex({ userId: 1, date: 1 });
    await db.collection('sharedEvents').createIndex({ date: 1 });
    console.log('Indexes created successfully');
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
        // Find the user's events document
        const userEvents = await db.collection('user_events').findOne(
            { userId: user._id },
            { projection: { _id: 0, [date]: 1 } }
        );
        // If the document exists and has events for the specified date, send them; otherwise, send an empty object
        res.send(userEvents && userEvents[date] ? userEvents[date] : {});
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

function repeatsOn(event, date) {
    const startDate = new Date(event.date);
    const targetDate = new Date(date);
    console.log('Checking event', event, 'for date', targetDate, 'start date', startDate);
    const endDate = event.endDate ? new Date(event.endDate) : null;
    if (targetDate < startDate || (endDate && targetDate > endDate)) {
        return false;
    }
    // Check if the start date matches the target date
    if (startDate.toDateString() === targetDate.toDateString()) {
        return false;
    }
    // Calculate difference in days
    const diffTime = Math.abs(targetDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    switch (event.repeat) {
        case 'daily':
            return true;
        case 'weekly':
            return diffDays % 7 === 0;
        case 'monthly':
            return startDate.getDate() === targetDate.getDate();
        case 'yearly':
            return startDate.getMonth() === targetDate.getMonth() && startDate.getDate() === targetDate.getDate();
        default:
            return false;
    }
}

apiRouter.post('/events', async (req, res) => {
    const token = req.cookies.token;
    const user = await db.collection('users').findOne({ token: token });
    if (user) {
        const date = req.query.date; // Get the date from the query parameter
        const events = req.body;
        // Update or insert the user's events document
        await db.collection('user_events').updateOne(
            { userId: user._id },
            { $set: { [`${date}`]: events, userId: user._id } },
            { upsert: true }
        );
        res.send(events);
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

// Get and set shared events
apiRouter.get('/shared-events', async (req, res) => {
    const date = req.query.date;
    const sharedEvents = await db.collection('sharedEvents').findOne(
        { date: date },
        { projection: { events: 1, _id: 0 } }
    );
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

apiRouter.delete('/events/all', async (req, res) => {
    const token = req.cookies.token;
    const user = await db.collection('users').findOne({ token: token });
    if (user) {
        await db.collection('events').deleteMany({ userId: user._id });
        console.log('All events cleared for user', user.username);
        res.status(204).send(); // Send a No Content response
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
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