let events = {};
let nextID = -1;

// Save the events to local storage
function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
    console.log("Events saved to local storage");
}

function clearEvents() {
    localStorage.removeItem('events');
    events = {};
    nextID = -1;
    document.getElementById('events-container').innerHTML = '';
    console.log("Events cleared from local storage");
}

// Load the events from local storage

// TODO: The y position of the event is not being loaded correctly, 170 is a magic number
function loadEvents() {
    const storedEvents = localStorage.getItem('events');
    if (storedEvents) {
        events = JSON.parse(storedEvents);
        nextID = Math.max(...Object.keys(events));
        for (const id in events) {
            const event = events[id];
            const eventElement = createEventElement();
            eventElement.style.left = event.x;
            eventElement.style.top = event.y;
            eventElement.textContent = event.name;
            eventElement.setAttribute('id', event.id);
            document.getElementById('events-container').appendChild(eventElement);
        }
    }
}

// Generate the time sidebar
document.addEventListener('DOMContentLoaded', function () {
    const timeSidebar = document.getElementById('time-sidebar');
    for (let hour = 6; hour <= 23; hour++) {
        const timeBlock = document.createElement('div');
        timeBlock.setAttribute('data-time', hour);
        timeBlock.textContent = `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
        timeBlock.className = 'time-block';
        timeSidebar.appendChild(timeBlock);
    }

    if (localStorage.getItem("events")) {
        loadEvents();
        console.log("Events loaded from local storage");
    }

});

// Event creation on click
document.getElementById('events-container').addEventListener('click', function (e) {
    if (!e.target.classList.contains('event')) { // If clicked on background
        const newEvent = createEventElement(); // Make a new event
        const containerRect = this.getBoundingClientRect();

        const x = e.clientX - containerRect.left; // Calculate position
        const y = e.clientY - containerRect.top; // relative to the events container

        newEvent.style.left = `${x}px`; // Set the position
        newEvent.style.top = `${y}px`;
        this.appendChild(newEvent); // organize HTML
        const hour = snapToClosestTimeBlock(newEvent)
        events[++nextID] = {
            id: nextID,
            name: newEvent.textContent,
            time: hour, // function actually moves event y
            x: newEvent.style.left,
            y: newEvent.style.top,
        };
        saveEvents();
        newEvent.setAttribute('id', nextID);
        console.log(events);
    }
});

// Make the events draggable
let draggedElement = null;
let startX, startY;

document.addEventListener('mousedown', function (e) {
    if (e.target.classList.contains('event')) {
        draggedElement = e.target;
        const rect = draggedElement.getBoundingClientRect();

        // Record the initial mouse position and element position
        startX = e.clientX;
        startY = e.clientY;
        draggedElement.startX = rect.left;
        draggedElement.startY = rect.top;

        // Prevent any text selection or other draggable elements interference
        e.preventDefault();
        draggedElement.classList.add("dragging");
    }
});

document.addEventListener('mousemove', function (e) {
    if (draggedElement) {
        // Calculate new position
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const newLeft = draggedElement.startX + dx;
        const newTop = draggedElement.startY + dy;

        // Get bounding rectangle of events container
        const containerRect = document.getElementById('events-container').getBoundingClientRect();

        // Adjust position relative to the events container
        draggedElement.style.left = `${newLeft - containerRect.left}px`;
        draggedElement.style.top = `${newTop - containerRect.top}px`;
    }
});

document.addEventListener('mouseup', function () {
    if (draggedElement) {
        snapToClosestTimeBlock(draggedElement);
        draggedElement.classList.remove("dragging");
        // Save the new position
        events[draggedElement.id].x = draggedElement.style.left;
        events[draggedElement.id].y = draggedElement.style.top;
        saveEvents();
        draggedElement = null;
    }
});


// Function to create a new event element
function createEventElement() {
    const eventElement = document.createElement('div');
    eventElement.className = 'event';
    eventElement.textContent = 'New Event';
    return eventElement;
}

// Snap the event to the closest time block
function snapToClosestTimeBlock(eventElement) {
    const timeBlocks = document.getElementsByClassName('time-block');
    let closest = null;
    let closestDist = Infinity;
    const eventRect = eventElement.getBoundingClientRect();
    const eventTop = eventElement.style.top.substring(0, eventElement.style.top.length - 2);
    const offset = eventRect.top - eventTop;
    Array.from(timeBlocks).forEach(block => {
        const blockRect = block.getBoundingClientRect().top;
        // console.log("event.style.top = ", blockRect.style.top.substring(0, eventElement.style.top.length - 2));
        const dist = Math.abs(blockRect - eventRect.top);
        if (dist < closestDist) {
            closest = block;
            closestDist = dist;
        }
    });
    console.log(closestDist)

    if (closest) {
        const closestRect = closest.getBoundingClientRect();
        eventElement.style.top = `${closestRect.top - offset}px`;
    }
    console.log("saved time = ", closest.getAttribute('data-time'));
    return closest.getAttribute('data-time');
}
