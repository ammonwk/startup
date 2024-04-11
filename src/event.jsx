import React, { useRef } from 'react';

const Event = ({ event, onUpdateEvent }) => {
    const eventRef = useRef(null);

    const handleDragStart = (e) => {
        eventRef.current.classList.add("dragging");
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', event.id);
    };

    const handleDragEnd = () => {
        eventRef.current.classList.remove("dragging");
        const updatedEvent = {
            ...event,
            x: eventRef.current.style.left,
            hour: parseFloat(eventRef.current.getAttribute('data-hour')),
        };
        onUpdateEvent(event.id, updatedEvent);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const eventId = e.dataTransfer.getData('text');
        if (eventId === event.id) {
            const updatedEvent = {
                ...event,
                x: `${Math.max(e.nativeEvent.offsetX - 45, 85)}px`,
                hour: parseFloat(e.target.getAttribute('data-time')),
            };
            onUpdateEvent(event.id, updatedEvent);
        }
    };

    return (
        <div
            ref={eventRef}
            className={"event"}
            style={{ left: event.x, top: `${(event.hour - 6) * 50}px` }}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-hour={event.hour}
        >
            {event.name}
        </div>
    );
};

export default Event;