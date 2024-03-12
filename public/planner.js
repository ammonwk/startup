let events = {};
let nextID = 0;
async function loadEvents() {
    try { //TODO: These events have to be hidden behind authentication
        // Get the scores from the service
        const response = await fetch('/api/events');
        events = await response.json();

        // Save the scores in case we go offline in the future
        localStorage.setItem('events', JSON.stringify(events));
    } catch (e) {
        // If there was an error then just use the last saved scores
        console.log('Failed to load events from the server. Using local data...', e);
        events = JSON.parse(localStorage.getItem('events')) || {};
    }

    // Initialize the events from local storage if they exist
    // Next available ID for new events = max existing ID + 1, or 0
    nextID = 0;
    if (Object.keys(events).length > 0) {
        nextID = Math.max(...Object.keys(events).map(id => parseInt(id, 10))) + 1;
    }

    populateEvents();
    setupEventListeners();
}


// Main setup functions
loadEvents();
if (localStorage.getItem("userName") != null) {
    document.querySelector(".welcome").innerHTML = "Welcome, " + localStorage.getItem("userName");
}
generateTimeSidebar();


// Generates time blocks for the sidebar, displaying hours from 6 AM to 10 PM
function generateTimeSidebar() {
    const container = document.getElementById('events-container');
    for (let hour = 6; hour <= 22; hour++) {
        const hr = document.createElement('div');
        hr.className = 'hr';
        container.appendChild(hr)
        container.appendChild(createTimeBlock(hour))
        container.appendChild(createTimeBlock(hour + 0.5, true))
    }
}

// Creates a single time block element for the sidebar
function createTimeBlock(hour, isHalf) {
    const timeBlock = document.createElement('div');
    timeBlock.className = `time-block ${isHalf ? 'half-hour' : ''}`;
    timeBlock.textContent = `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
    timeBlock.setAttribute('data-time', hour);
    return timeBlock;
}

// Populates the events container from the events object
function populateEvents() {
    const container = document.getElementById('events-container');
    Object.values(events).forEach(event => container.appendChild(createEventElement(event)));
}

// Sets up click and drag event listeners to enable creating and moving event elements within the planner
function setupEventListeners() {
    const container = document.getElementById('events-container');
    container.addEventListener('click', e => {
        // Create a new event at the clicked time block if the click wasn't on an existing event
        if (!e.target.classList.contains('event')) {
            const hour = parseFloat(e.target.getAttribute('data-time'));
            const newEvent = createEventElement({
                id: nextID++,
                x: `${Math.max(e.offsetX - 45, 85)}px`, // Center the event on the cursor
                hour: hour
            });
            container.appendChild(newEvent);
            // Update the events object and save the new event data
            events[newEvent.id] = { id: newEvent.id, name: newEvent.textContent, x: newEvent.style.left, hour: hour };
            saveEvents();
        }
    });

    // Handle drag operations for event elements
    ['mousedown', 'touchstart', 'mousemove', 'touchmove', 'mouseup', 'touchend'].forEach(type =>
        document.addEventListener(type, handleDrag, type.startsWith('touch') ? { passive: false } : undefined)
    ); // Add passive: false to touch events to allow for preventDefault()
}

// Saves the current state of events to local storage
async function saveEvents() {
    localStorage.setItem('events', JSON.stringify(events));
    try {
        await fetch('/api/events', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(events),
        });
    } catch {
        console.log('Failed to save events to the server. Saving locally...');
    }

}

// Clears all events from local storage and resets the application state
function clearEvents() {
    localStorage.removeItem('events');
    events = {};
    nextID = 0;
    document.querySelectorAll('.event').forEach(event => event.remove());
}

// Creates a new event element with the given data
function createEventElement({ id, name = 'New Event', x = '0px', hour = 8 }) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event';
    eventElement.textContent = name;
    eventElement.style.left = x;
    eventElement.setAttribute('id', id || nextID++);
    const hourElement = document.querySelector(`[data-time="${hour}"]`);
    eventElement.style.top = `${hourElement.offsetTop}px`;
    snapToClosestTimeBlock(eventElement); // Adjust the event's position to the nearest time block
    return eventElement;
}

let startX, startY, draggedElement = null;

// Handles dragging operations for event elements
function handleDrag(e) {
    if (['mousedown', 'touchstart'].includes(e.type)) {
        if (e.target.classList.contains('event')) {
            draggedElement = e.target;
            draggedElement.classList.add("dragging");
            startX = (e.pageX || e.touches[0].pageX) - draggedElement.offsetLeft;
            startY = (e.pageY || e.touches[0].pageY) - draggedElement.offsetTop;
        }
    } else if (['mousemove', 'touchmove'].includes(e.type) && draggedElement) {
        e.preventDefault(); // Prevent scrolling while dragging
        let x = (e.pageX || e.touches[0].pageX) - startX;
        let y = (e.pageY || e.touches[0].pageY) - startY;
        draggedElement.style.left = `${Math.max(x, 85)}px`; // 85px is the left margin of the time sidebar
        draggedElement.style.top = `${y}px`;
    } else if (['mouseup', 'touchend'].includes(e.type) && draggedElement) {
        snapToClosestTimeBlock(draggedElement); // Snap to the nearest time block on release
        // Update event data with the new position and save changes
        events[draggedElement.id].x = draggedElement.style.left;
        draggedElement.classList.remove("dragging");
        events[draggedElement.id].hour = parseFloat(draggedElement.getAttribute('data-hour'));
        saveEvents();
        draggedElement = null;
    }
}

// Adjusts an event element's y position to snap to the closest time block
function snapToClosestTimeBlock(eventElement) {
    const timeBlocks = document.querySelectorAll('.time-block');
    let closest = null;
    let closestDist = Infinity;
    timeBlocks.forEach(block => {
        const top = eventElement.style.top.substring(0, eventElement.style.top.length - 2);
        const blockDist = Math.abs(block.offsetTop - top);
        if (blockDist < closestDist) {
            closest = block;
            closestDist = blockDist;
        }
    });
    if (closest) {
        eventElement.style.top = `${closest.offsetTop}px`;
        eventElement.setAttribute('data-hour', closest.getAttribute('data-time'));
    }
}
