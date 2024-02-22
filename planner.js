events = {};
nextID = -1;
loadEventsFromLocalStorage();
generateTimeSidebar();
setupEventListeners();


// Utility functions
function saveToLocalStorage() {
    localStorage.setItem('events', JSON.stringify(events));
    console.log("Events saved to local storage");
}

function clearLocalStorage() {
    localStorage.removeItem('events');
    events = {};
    nextID = -1;
    document.getElementById('events-container').innerHTML = '';
    console.log("Events cleared from local storage");
}

function loadEventsFromLocalStorage() {
    const storedEvents = localStorage.getItem('events');
    if (storedEvents) {
        events = JSON.parse(storedEvents);
        nextID = Math.max(-1, ...Object.keys(events).map(Number));
        Object.values(events).forEach(event => displayEvent(event));
        console.log("Events loaded from local storage");
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
    const eventElement = createEventElement(event.id, event.name, event.x, event.y);
    snapToClosestTimeBlock(eventElement);
    document.getElementById('events-container').appendChild(eventElement);
}


function createEventElement(id = ++nextID, name = 'New Event', x = 0, y = 0) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event';
    eventElement.textContent = name;
    eventElement.style.left = x;
    eventElement.style.top = y;
    eventElement.setAttribute('id', id);
    snapToClosestTimeBlock(eventElement);
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

        snapToClosestTimeBlock(newEvent);
        events[newEvent.id] = { id: newEvent.id, name: newEvent.textContent, x: `${x}px`, y: `${y}px` };
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
            events[id].y = draggedElement.style.top;
            saveToLocalStorage();
        }
        draggedElement.classList.remove("dragging");
        snapToClosestTimeBlock(draggedElement);
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
    const eventTop = eventElement.style.top.substring(0, eventElement.style.top.length - 2);

    Array.from(timeBlocks).forEach(block => {
        const blockRect = block.getBoundingClientRect().top;
        const dist = Math.abs(blockRect - eventRect.top);
        if (dist < closestDist) {
            closest = block;
            closestDist = dist;
        }
    });

    if (closest) {
        const closestRect = closest.getBoundingClientRect();
        // getBoundingClientRect and style.top are offset, so we need to convert
        const offset = eventRect.top - eventTop;
        eventElement.style.top = `${closestRect.top - offset}px`;
    }
}