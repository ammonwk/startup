document.addEventListener('DOMContentLoaded', function () {
    // Generate the time sidebar
    const timeSidebar = document.getElementById('time-sidebar');

    for (let hour = 6; hour <= 23; hour++) {
        const timeBlock = document.createElement('div');
        timeBlock.textContent = `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
        timeBlock.className = 'time-block';
        timeSidebar.appendChild(timeBlock);
    }

    // Event creation on click in the events container
    document.getElementById('events-container').addEventListener('click', function (e) {
        // Only create a new event if the click wasn't on an existing event
        if (!e.target.classList.contains('event')) {
            const newEvent = createEventElement();


            // Get bounding rectangle of events container
            const containerRect = this.getBoundingClientRect();

            // Calculate position relative to the events container
            const x = e.clientX - containerRect.left;
            const y = e.clientY - containerRect.top;

            newEvent.style.left = `${x}px`;
            newEvent.style.top = `${y}px`;
            this.appendChild(newEvent);
            snapToClosestTimeBlock(newEvent)
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
            draggedElement = null;
        }
    });
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
    const offset = eventRect.top - eventTop
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
        console.log(Math.abs(closestRect.top - eventRect.top));
        console.log(eventElement.style.top);
        eventElement.style.top = `${closestRect.top - offset}px`;
        // eventElement.style.left = `20px`;
        console.log(eventElement.style.top);
    }
}
