events = {};
nextID = -1;
generateTimeSidebar();
loadEventsFromLocalStorage();
setupEventListeners();


// Utility functions
function saveToLocalStorage() {
    localStorage.setItem('events', JSON.stringify(events));
}

function clearLocalStorage() {
    localStorage.removeItem('events');
    events = {};
    nextID = -1;
    document.getElementById('events-container').innerHTML = '';
}

function loadEventsFromLocalStorage() {
    const storedEvents = localStorage.getItem('events');
    if (storedEvents) {
        events = JSON.parse(storedEvents);
        nextID = Math.max(-1, ...Object.keys(events).map(Number));
        Object.values(events).forEach(event => displayEvent(event));
    }
}

function generateTimeSidebar() {
    const timeSidebar = document.getElementById('time-sidebar');
    for (let hour = 6; hour <= 23; hour++) {
        const timeBlock = document.createElement('div');
        timeBlock.className = 'time-block';
        timeBlock.setAttribute('data-time', hour);
        timeBlock.textContent = `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
        timeSidebar.appendChild(timeBlock);
    }
}

function displayEvent(event) {
    const eventElement = createEventElement(event.id, event.name, event.x, event.hour);
    document.getElementById('events-container').appendChild(eventElement);
}


function createEventElement(id = ++nextID, name = 'New Event', x = 0, hour = 8) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event';
    eventElement.textContent = name;
    eventElement.style.left = x;
    hourBox = document.querySelector(`[data-time="${hour}"]`);
    const containerRect = document.getElementById('events-container').getBoundingClientRect();
    const adjustedTop = hourBox.getBoundingClientRect().top - containerRect.top + document.getElementById('events-container').scrollTop - document.body.scrollTop;
    eventElement.style.top = `${adjustedTop}px`;
    eventElement.setAttribute('id', id);
    return eventElement;
}

function setupEventListeners() {
    document.getElementById('events-container').addEventListener('click', (e) => onContainerClick(e));
    document.addEventListener('mousedown', (e) => onDragStart(e));
    document.addEventListener('mousemove', (e) => onDrag(e));
    document.addEventListener('mouseup', () => onDragEnd());
}

function onContainerClick(e) {
    if (!e.target.classList.contains('event')) {
        const newEvent = createEventElement();
        const { x, y } = calculatePosition(e, e.currentTarget);
        newEvent.style.left = `${x}px`;
        newEvent.style.top = `${y}px`;
        e.currentTarget.appendChild(newEvent);
        events[newEvent.id] = { id: newEvent.id, name: newEvent.textContent, x: `${x}px` };
        snapToClosestTimeBlock(newEvent); // Also sets event.hour
        saveToLocalStorage();
    }
}

let draggedElement = null;
function onDragStart(e) {
    if (e.target.classList.contains('event')) {
        e.preventDefault();
        draggedElement = e.target;
        const rect = draggedElement.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        draggedElement.classList.add("dragging");
    }
}

function onDrag(e) {
    if (draggedElement) {
        const containerRect = document.getElementById('events-container').getBoundingClientRect();
        let newX = e.clientX - containerRect.left - startX;
        let newY = e.clientY - containerRect.top - startY;

        // Bind event to the container
        newX = Math.max(0, Math.min(newX, containerRect.width - draggedElement.offsetWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - draggedElement.offsetHeight));

        draggedElement.style.left = `${newX}px`;
        draggedElement.style.top = `${newY}px`;
    }
}

function onDragEnd() {
    if (draggedElement) {
        const id = draggedElement.getAttribute('id');
        if (id && events[id]) {
            events[id].x = draggedElement.style.left;
        }
        draggedElement.classList.remove("dragging");
        snapToClosestTimeBlock(draggedElement);
        saveToLocalStorage();
        draggedElement = null;
    }
}

function calculatePosition(e, container, isDragging = false) {
    const containerRect = container.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    if (isDragging) {
        return { x: x + startX - e.clientX, y: y + startY - e.clientY };
    }
    return { x, y };
}

function snapToClosestTimeBlock(eventElement) {
    const timeBlocks = document.getElementsByClassName('time-block');
    let closest = null;
    let closestDist = Infinity;
    const eventRect = eventElement.getBoundingClientRect();
    const containerRect = document.getElementById('events-container').getBoundingClientRect();

    Array.from(timeBlocks).forEach(block => {
        const blockRect = block.getBoundingClientRect();
        const dist = Math.abs(blockRect.top - eventRect.top);
        if (dist < closestDist) {
            closest = block;
            closestDist = dist;
        }
    });

    if (closest) {
        // Adjust position to be relative to the container, not the viewport
        // Is there an easier way to do this? Jquery has offset(), but that wouldn't combine with React
        const adjustedTop = closest.getBoundingClientRect().top - containerRect.top + document.getElementById('events-container').scrollTop - document.body.scrollTop;
        eventElement.style.top = `${adjustedTop}px`;
        events[eventElement.id].hour = closest.getAttribute('data-time');
    }
}
