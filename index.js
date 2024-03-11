const express = require('express');
const app = express();

// Middleware - Static file hosting
app.use(express.static('public'));

// Listening to a network port
const port = 8080;
app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});