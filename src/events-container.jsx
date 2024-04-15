import React, { useState, useEffect, useRef } from "react";
import TimeBlock from "./timeblock";
import Event from "./event";
import EventModal from "./event-modal";

function EventsContainer({ selectedDate, apiEndpoint, shared, clearEventsTrigger, localStorageEnabled }) {
    const [events, setEvents] = useState({});
    const [nextId, setNextId] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const ws = useRef(null);
    const saveEventsTimeout = useRef(null);

    // Load events from the server when the selected date changes
    useEffect(() => {
        setEvents({});
        setNextId(0);
        loadEvents(selectedDate);
    }, [selectedDate]);

    // Connect to the WebSocket server when the component mounts
    useEffect(() => {
        if (shared) {
            const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
            ws.current = new WebSocket(wsScheme + "://" + window.location.host + "/path");

            ws.current.onopen = function () {
                console.log('WebSocket connection established');
            };

            ws.current.onmessage = function (event) {
                const message = JSON.parse(event.data);
                if (message.type === 'sharedCalendarUpdated' && message.date === selectedDate.format('YYYY-MM-DD')) {
                    loadEvents(selectedDate);
                }
            };

            // Clean up the WebSocket connection when the component unmounts
            return () => {
                if (ws.current) {
                    ws.current.close();
                }
            };
        }
    }, []);

    const clearEvents = () => {
        localStorage.removeItem('events');
        setEvents({});
        setNextId(0);
        saveEvents({});
    };

    useEffect(() => {
        if (clearEventsTrigger) {
            clearEvents(); // The function you provided to reset events
        }
    }, [clearEventsTrigger]);

    const loadEvents = async (date) => {
        try {
            const response = await fetch(`${apiEndpoint}?date=${date.format("YYYY-MM-DD")}`);
            if (response.ok) {
                const loadedEvents = await response.json();
                setEvents(loadedEvents);
                if (!shared && localStorageEnabled) {
                    localStorage.setItem(`events-${date.format("YYYY-MM-DD")}`, JSON.stringify(loadedEvents));
                }
                const maxId = Object.keys(loadedEvents).reduce((max, id) => Math.max(max, parseInt(id, 10)), 0);
                setNextId(maxId + 1);
            } else {
                if (!shared && localStorageEnabled) {
                    console.log("Failed to load events from the server. Using local data...", response.status);
                    loadLocalEvents(date);
                } else {
                    console.log('Failed to load shared events from the server.', response.status);
                }
            }
        } catch (error) {
            if (!shared && localStorageEnabled) {
                console.error("Error loading events:", error);
                loadLocalEvents(date);
            } else {
                console.error('Error loading shared events:', error);
            }
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
            name: "",
            y: `${(hour - 6) * 68}px`,
            color: "#ffffff",
            duration: 30,
        };
        setEvents((prevEvents) => ({ ...prevEvents, [nextId]: newEvent }));
        setNextId((prevId) => prevId + 1);
        // When an event is created, it snaps into place and is saved then
    };

    const updateEvent = (id, updatedEvent) => {
        setEvents(prevEvents => ({ ...prevEvents, [id]: updatedEvent }));
        saveEvents({ ...events, [id]: updatedEvent });
    };

    const moveEvent = (id, dy) => {
        setEvents(prevEvents => {
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
        setEvents(prevEvents => {
            const currentEvent = prevEvents[id];
            const updatedEvent = {
                ...currentEvent,
                y: `${newY}px`,
            };
            return { ...prevEvents, [id]: updatedEvent };
        });
        saveEvents({ ...events, [id]: { ...events[id], y: `${newY}px` } });
    };

    useEffect(() => {
        const handleBeforeUnload = async (e) => {
            // Directly call saveEvents if there is any pending operation
            if (saveEventsTimeout.current) {
                clearTimeout(saveEventsTimeout.current);
                saveEventsTimeout.current = null;
                await saveEvents(Object.assign({}, events));  // Make sure to pass the current events state
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [events]);

    const saveEventsDebounced = (updatedEvents) => {
        if (saveEventsTimeout.current) {
            clearTimeout(saveEventsTimeout.current);
        }
        saveEventsTimeout.current = setTimeout(() => {
            saveEvents(updatedEvents);
        }, 500); // 0.5 seconds delay
    };

    async function saveEvents(updatedEvents) {
        if (saveEventsTimeout.current) {
            clearTimeout(saveEventsTimeout.current);
            saveEventsTimeout.current = null;
        }
        if (!shared && localStorageEnabled) {
            localStorage.setItem(`events-${selectedDate.format("YYYY-MM-DD")}`, JSON.stringify(updatedEvents));
        }
        try {
            await fetch(`${apiEndpoint}?date=${selectedDate.format("YYYY-MM-DD")}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(updatedEvents),
            });
            if (shared && ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'sharedCalendarUpdated',
                    date: selectedDate.format('YYYY-MM-DD'),
                }));
            } else {
                console.log('WebSocket connection is not open yet...');
            }
        } catch (error) {
            console.log(`Failed to save events to the server. ${!shared && localStorageEnabled ? "Saving locally..." : ""} `, error);
        }
    };

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
        setEditingEvent(prevEvent => ({
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