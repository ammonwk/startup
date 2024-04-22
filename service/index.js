const express = require('express');
const compression = require('compression');
const app = express();

app.use(compression({ level: 6 }));

const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: config.openaiApiKey,
});

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
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
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
            { projection: { _id: 0 } }
        ) || {};

        // Create an object to store the events for the specified date
        const eventsForDate = userEvents[date] ? { [date]: userEvents[date] } : { [date]: [] };
        // Iterate over all the dates in the user's events document
        for (const eventDate of Object.keys(userEvents)) {
            if (eventDate !== date && eventDate !== 'userId') {
                // Iterate over the events for each date
                for (const event of Object.values(userEvents[eventDate])) {
                    // Check if the event should repeat on the specified date
                    if (repeatsOn(event, date)) {
                        // check for exceptions
                        if (event.exceptions && event.exceptions.includes(date)) {
                            continue;
                        }

                        if (!eventsForDate[date]) {
                            eventsForDate[date] = [event];
                        } else {
                            // let event_to_add = JSON.parse(JSON.stringify(event));
                            event["repeated"] = true;
                            eventsForDate[date] = { ...eventsForDate[date], [event.id]: event };
                        }
                    }
                }
            }
        }
        res.send(eventsForDate && eventsForDate[date] ? eventsForDate[date] : {});
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

function repeatsOn(event, date) {
    const startDate = new Date(event.date);
    const targetDate = new Date(date);
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
        const nonRepeatedEvents = Object.keys(events).reduce((acc, eventId) => {
            const event = events[eventId];
            if (!event.repeated) {
                acc[eventId] = event; // Only include non-repeated events
            }
            return acc;
        }, {});

        // Update or insert the user's events document
        await db.collection('user_events').updateOne(
            { userId: user._id },
            { $set: { [`${date}`]: nonRepeatedEvents, userId: user._id } },
            { upsert: true }
        );
        res.send(nonRepeatedEvents);
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});


apiRouter.post('/events/exception', async (req, res) => {
    const token = req.cookies.token;
    const user = await db.collection('users').findOne({ token: token });
    if (user) {
        const eventId = req.body.eventId;
        const date = req.body.date;
        // Find the user's events document
        const userEvents = await db.collection('user_events').findOne(
            { userId: user._id },
            { projection: { _id: 0 } }
        ) || {};
        let earliestDate = null;
        // Iterate over all the dates in the user's events document
        for (const eventDate of Object.keys(userEvents)) {
            if (eventDate !== 'userId') {
                for (const event of Object.values(userEvents[eventDate])) {
                    if (event.id === eventId) {
                        if (!earliestDate || new Date(eventDate) < new Date(earliestDate)) {
                            earliestDate = eventDate;
                        }
                    }
                }
            }
        }
        if (earliestDate) {
            // Update the user's events document to add the exception
            await db.collection('user_events').updateOne(
                { userId: user._id },
                { $push: { [`${earliestDate}.${eventId}.exceptions`]: date } }
            );
            res.send({ msg: 'Exception added successfully' });
        } else {
            res.status(404).send({ msg: 'Event not found' });
        }
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

apiRouter.post('/events/enddate', async (req, res) => {
    const token = req.cookies.token;
    const user = await db.collection('users').findOne({ token: token });
    if (user) {
        const eventId = req.body.eventId;
        const date = req.body.date;
        // Find the user's events document
        const userEvents = await db.collection('user_events').findOne(
            { userId: user._id },
            { projection: { _id: 0 } }
        ) || {};
        let earliestDate = null;
        // Iterate over all the dates in the user's events document
        for (const eventDate of Object.keys(userEvents)) {
            if (eventDate !== 'userId') {
                for (const event of Object.values(userEvents[eventDate])) {
                    if (event.id === eventId) {
                        if (!earliestDate || new Date(eventDate) < new Date(earliestDate)) {
                            earliestDate = eventDate;
                        }
                    }
                }
            }
        }
        if (earliestDate) {
            // Update the user's events document to add the exception
            await db.collection('user_events').updateOne(
                { userId: user._id },
                { $set: { [`${earliestDate}.${eventId}.endDate`]: date } }
            );
            res.send({ msg: 'Exception added successfully' });
        } else {
            res.status(404).send({ msg: 'Event not found' });
        }
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
});

const prompt = `Please extract the schedule details from the image and convert them into a structured JSON format. For events that occur on multiple days within a week, create separate entries for EACH AND EVERY day of the week that the event occurs. The JSON structure for each event should include:

1) A unique numeric ID for each occurrence of an event.
2) The full title or name of the event.
3) The start time formatted as 'HH:MM AM/PM'.
4) The duration, calculated as the difference between the start and end times in minutes. If the duration is not provided, assume a duration of 30 minutes.
5) A pastel color for the event, represented as a hex code. Base the color on the event title or type, using the same color for events with the same title or type.
5) A 'repeat' field indicating the frequency of the event. If an event occurs multiple times in a week, each occurrence should still be marked 'weekly'. If not specified, use context clues to determine if the event is "daily", "weekly", "monthly", "yearly", or does not repeat ("").
6) An 'endDate' field, if a specific end date is provided; otherwise, leave it blank.
7) The 'date' field should reflect the first date the event occurs. If not specified, infer the date from the semester dates provided in the schedule context.
8) An empty 'exceptions' list, unless there are specific dates mentioned where the event does not occur.
YOU MUST INCLUDE EACH OF THESE FIELDS.

Structure the JSON to reflect each occurrence of events that happen more than once a week, as individual 'weekly' events on their respective days, using the earliest date the repeating event would start on.

Example JSON output:
{
    "event1": {
        "id": "1",
        "name": "Team Meeting",
        "date": "2024-04-20",
        "time": "10:00 AM",
        "duration": 60,
        "color": "#FFD700",
        "repeat": "weekly",
        "endDate": null,
        "exceptions": []
    },
    "event2": {
        "id": "2",
        "name": "Project Deadline",
        "date": "2024-04-22",
        "time": "12:00 PM",
        "duration": 30,
        "color": "#FF6347",
        "repeat": "",
        "endDate": "2024-05-22",
        "exceptions": [
            "2024-05-01"
        ]
    },
    "event3": {
        "id": "3",
        "name": "Doctor's Appointment",
        "date": "2024-04-25",
        "time": "03:00 PM",
        "duration": 30,
        "color": "#3CB371",
        "repeat": "",
        "endDate": null,
        "exceptions": []
    }
}

BE PRECISE: It's very important that you don't miss any events, and that you don't duplicate any either.
If you can't tell what date an event should start on, just name the day it repeats on, like "Wednesday."
Please return JSON of the events from my attached image.`;

app.post('/api/gpt-parse-image', async (req, res) => {
    const { image_data } = req.body;  // Receive the Base64 encoded image data

    // Check if the image data is provided
    if (!image_data) {
        return res.status(400).send({ msg: 'No image data provided' });
    }

    try {
        // API call to OpenAI's GPT API
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant designed to output JSON.",
                },
                {
                    role: "user", content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                "url": `data:image/jpeg;base64,${image_data}`
                            }
                        }
                    ]
                },
            ],
            model: "gpt-4-turbo-2024-04-09",
            response_format: { type: "json_object" },
        });
        // Sending the processed response back to the client
        // console.log('Processed image:', completion.choices[0].message.content)
        res.json(completion.choices[0].message.content);
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send({ msg: 'Failed to process the image', error: error.message });
    }
});



apiRouter.post('/events/import-events', async (req, res) => {
    const token = req.cookies.token;
    const user = await db.collection('users').findOne({ token: token });
    if (!user) {
        return res.status(401).send({ msg: 'Unauthorized' });
    }

    const eventsDict = req.body;
    if (!eventsDict || Object.keys(eventsDict).length === 0) {
        return res.status(400).send({ msg: 'No events to import' });
    }

    try {
        const bulkOps = [];
        Object.keys(eventsDict).forEach(eventId => {
            const event = eventsDict[eventId];
            if (event && event.date) {
                // Creates a dynamic key using the event's date
                const dateKey = event.date;
                const update = { $set: {} };
                update.$set[`${dateKey}.${eventId}`] = event;

                bulkOps.push({
                    updateOne: {
                        filter: { userId: user._id },
                        update: update,
                        upsert: true
                    }
                });
            }
        });

        if (bulkOps.length > 0) {
            await db.collection('user_events').bulkWrite(bulkOps);
            res.status(200).send({ msg: 'Events imported successfully' });
        } else {
            res.status(400).send({ msg: 'No valid events to process' });
        }
    } catch (error) {
        console.error("Error importing events:", error);
        res.status(500).send({ msg: 'Error importing events', error: error.message });
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
    // Inform the client of the error
    res.status(500).send('Server Error: ' + err.message);
});

// secureApiRouter verifies credentials for endpoints
var secureApiRouter = express.Router();
apiRouter.use(secureApiRouter);

secureApiRouter.use(async (req, res, next) => {
    const token = req.cookies.token;
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