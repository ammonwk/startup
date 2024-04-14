import React, { useState, useEffect } from "react";
import TimeBlock from "./timeblock";
import Event from "./event";
import EventModal from "./event-modal";

function EventsContainer({ selectedDate }) {
    const [events, setEvents] = useState({});
    const [nextId, setNextId] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setEvents({});
        setNextId(0);
        loadEvents(selectedDate);
    }, [selectedDate]);

    const loadEvents = async (date) => {
        try {
            const response = await fetch(`/api/events?date=${date.format("YYYY-MM-DD")}`);
            if (response.ok) {
                const loadedEvents = await response.json();
                setEvents(loadedEvents);
                localStorage.setItem(`events-${date.format("YYYY-MM-DD")}`, JSON.stringify(loadedEvents));
                const maxId = Object.keys(loadedEvents).reduce((max, id) => Math.max(max, parseInt(id, 10)), 0);
                setNextId(maxId + 1);
            } else {
                console.log("Failed to load events from the server. Using local data...", response.status);
                loadLocalEvents(date);
            }
        } catch (error) {
            console.error("Error loading events:", error);
            loadLocalEvents(date);
        }
    };

    const loadLocalEvents = (date) => {
        try {
            const localEvents = JSON.parse(localStorage.getItem(`events-${date.format("YYYY-MM-DD")}`)) || {};
            setEvents(localEvents);
            const maxId = Object.keys(localEvents).reduce((max, id) => Math.max(max, parseInt(id, 10)), 0);
            setNextId(maxId + 1);
        } catch (error) {
            console.error("Error parsing local events:", error);
        }
    };

    const createEvent = (hour) => {
        const newEvent = {
            id: nextId,
            name: "Click to change the event name.",
            y: `${(hour - 6) * 68}px`,
            color: "#ffffff",
            duration: 30,
        };
        setEvents((prevEvents) => ({ ...prevEvents, [nextId]: newEvent }));
        setNextId((prevId) => prevId + 1);
        saveEvents({ ...events, [nextId]: newEvent });
    };

    const updateEvent = (id, updatedEvent) => {
        setEvents((prevEvents) => ({ ...prevEvents, [id]: updatedEvent }));
        saveEvents({ ...events, [id]: updatedEvent });
    };

    const moveEvent = (id, dy) => {
        setEvents((prevEvents) => {
            const currentEvent = prevEvents[id];
            const currentY = parseFloat(currentEvent.y);
            const updatedEvent = {
                ...currentEvent,
                y: `${currentY + dy}px`,
            };
            return { ...prevEvents, [id]: updatedEvent };
        });
    };

    const snapEvent = (id, newY) => {
        setEvents((prevEvents) => {
            const currentEvent = prevEvents[id];
            const updatedEvent = {
                ...currentEvent,
                y: `${newY}px`,
            };
            return { ...prevEvents, [id]: updatedEvent };
        });
        saveEvents({ ...events, [id]: { ...events[id], y: `${newY}px` } });
    };

    async function saveEvents(updatedEvents) {
        localStorage.setItem(`events-${selectedDate.format("YYYY-MM-DD")}`, JSON.stringify(updatedEvents));
        try {
            await fetch(`/api/events?date=${selectedDate.format("YYYY-MM-DD")}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(updatedEvents),
            });
        } catch (error) {
            console.log("Failed to save events to the server. Saving locally...", error);
        }
    }

    const handleEditEvent = (id) => {
        setShowModal(true);
        setEditingEvent(events[id]);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSaveEvent = () => {
        if (editingEvent) {
            updateEvent(editingEvent.id, editingEvent);
            setShowModal(false);
        }
    };

    const handleEventChange = (e) => {
        const { name, value } = e.target;
        setEditingEvent((prevEvent) => ({
            ...prevEvent,
            [name]: name === "duration" ? parseInt(value, 10) : value,
        }));
    };

    const handleDeleteEvent = () => {
        if (editingEvent) {
            const updatedEvents = { ...events };
            delete updatedEvents[editingEvent.id];
            setEvents(updatedEvents);
            saveEvents(updatedEvents);
            setShowModal(false);
        }
    };

    return (
        <div id="events-container">
            {[...Array(17)].map((_, index) => (
                <React.Fragment key={index}>
                    <div className="hr" />
                    <TimeBlock hour={6 + index} onCreateEvent={createEvent} onSnapEvent={snapEvent} isDragging={isDragging} />
                    <TimeBlock
                        hour={6 + index + 0.5}
                        onCreateEvent={createEvent}
                        onSnapEvent={snapEvent}
                        isDragging={isDragging}
                        isHalf
                    />
                </React.Fragment>
            ))}
            {Object.values(events).map((event) => (
                <Event
                    key={event.id}
                    event={event}
                    events={Object.values(events)}
                    onMoveEvent={moveEvent}
                    onSnapEvent={snapEvent}
                    onEditEvent={handleEditEvent}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                />
            ))}
            <EventModal
                showModal={showModal}
                editingEvent={editingEvent}
                onCloseModal={handleCloseModal}
                onSaveEvent={handleSaveEvent}
                onDeleteEvent={handleDeleteEvent}
                onEventChange={handleEventChange}
            />
        </div>
    );
}

export default EventsContainer;