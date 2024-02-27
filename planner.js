events = {};
nextID = -1;
generateTimeSidebar();
loadEventsFromLocalStorage();
setupEventListeners();

// TODO: Fix bug where event is duplicated when dropping element on time block
// TODO: Fix magic number 85 pixels (could ems help?)

// Utility functions
function saveToLocalStorage() {
    localStorage.setItem('events', JSON.stringify(events));
}

function clearLocalStorage() {
    localStorage.removeItem('events');
    events = {};
    nextID = -1;
    // Delete all events from the page
    var events_on_page = document.getElementsByClassName('event');
    while (events_on_page.length > 0) {
        events_on_page[0].parentNode.removeChild(events_on_page[0]);
    }
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
    const eventsContainer = document.getElementById('events-container');
    for (let hour = 6; hour <= 22; hour++) {
        // Add horizontal rules
        const hr = document.createElement('div');
        hr.className = 'hr';
        hr.style.top = `${(hour - 1.92) * 4.25}em`;
        eventsContainer.appendChild(hr);
        // Add hour blocks
        const timeBlock = document.createElement('div');
        timeBlock.className = 'time-block';
        timeBlock.setAttribute('data-time', hour);
        timeBlock.textContent = `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
        eventsContainer.appendChild(timeBlock);
        // Add half-hour blocks
        const halfTimeBlock = document.createElement('div');
        halfTimeBlock.className = 'time-block half-hour';
        halfTimeBlock.setAttribute('data-time', hour + 0.5);
        // TODO: Invisible letters are probably not the best workaround
        halfTimeBlock.textContent = `${hour % 12 || 12}:30 ${hour < 12 ? 'AM' : 'PM'}`;
        eventsContainer.appendChild(halfTimeBlock);
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

    document.addEventListener('touchstart', (e) => onDragStart(e), { passive: false });
    document.addEventListener('touchmove', (e) => onDrag(e), { passive: false });
    document.addEventListener('touchend', () => onDragEnd(), { passive: false });
}

function onContainerClick(e) {
    if (!e.target.classList.contains('event') && !draggedElement) {
        const newEvent = createEventElement();
        const { x, y } = calculatePosition(e, e.currentTarget);
        newEvent.style.left = `${Math.max(85, x)}px`; // 85 is the width of the time sidebar
        newEvent.style.top = `${y}px`;
        e.currentTarget.appendChild(newEvent);
        events[newEvent.id] = { id: newEvent.id, name: newEvent.textContent, x: `${Math.max(85, x)}px` };
        snapToClosestTimeBlock(newEvent); // Also sets event.hour
        saveToLocalStorage();
    }
}

let draggedElement = null;
function onDragStart(e) {
    if (e.target.classList.contains('event')) {
        draggedElement = e.target;
        const rect = draggedElement.getBoundingClientRect();
        // null coalescing operator (??) is used to handle touch events
        startX = (e.clientX ?? e.touches[0].pageX) - rect.left;
        startY = (e.clientY ?? e.touches[0].pageY) - rect.top;
        draggedElement.classList.add("dragging");
    }
}

function onDrag(e) {
    if (draggedElement) {
        const containerRect = document.getElementById('events-container').getBoundingClientRect();
        if (e.type === 'touchmove') {
            e.preventDefault();
            e = e.touches[0];
        }
        // null coalescing operator (??) is used to handle touch events
        let newX = (e.pageX ?? e.clientX) - containerRect.left - startX;
        let newY = (e.pageY ?? e.clientY) - containerRect.top - startY;

        // Bind event to the container
        newX = Math.max(85, Math.min(newX, containerRect.width - draggedElement.offsetWidth));
        newY = Math.max(0, Math.min(newY, containerRect.height - draggedElement.offsetHeight));
        // the 85px makes sure events don't cover the time sidebar (Magic number: BAD)
        if (draggedElement.style) {
            draggedElement.style.left = `${newX}px`;
            draggedElement.style.top = `${newY}px`;
        }
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
        draggedElement = 1;
        dragTimer = setTimeout(function () {
            draggedElement = null;
        }, 50); // Prevents a new event from being created when dragging an existing event

    }
}

function calculatePosition(e, container, isDragging = false) {
    const containerRect = container.getBoundingClientRect();
    // const x = touch.pageX || e.clientX;
    // const y = touch.pageY || e.clientY;
    let x, y;
    if (e.type === 'touchmove') {
        x = touch.pageX - containerRect.left;
        y = touch.pageY - containerRect.top;
    } else {
        x = e.clientX - containerRect.left;
        y = e.clientY - containerRect.top;
    }
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
        const adjustedTop = closest.getBoundingClientRect().top
            - containerRect.top
            + document.getElementById('events-container').scrollTop
            - document.body.scrollTop;
        eventElement.style.top = `${adjustedTop}px`;
        events[eventElement.id].hour = closest.getAttribute('data-time');
    }
}
