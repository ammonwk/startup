import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import TimeBlock from "./timeblock";
import Event from "./event";
import EventModal from "./event-modal";
import moment from "moment";
import { Modal, Button } from "react-bootstrap";

function EventsContainer({ selectedDate, apiEndpoint, shared, clearEventsTrigger, localStorageEnabled, importEventsData }) {
    const [events, setEvents] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [showRepeatModal, setShowRepeatModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [movingRepeat, setMovingRepeat] = useState(false);

    const ws = useRef(null);
    const saveEventsTimeout = useRef(null);

    // Load events from the server when the selected date changes
    useEffect(() => {
        setEvents({});
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
        saveEvents({});
    };

    // Currently unused except to debug
    async function clearAllUserEvents() {
        setEvents({});

        if (!shared && localStorageEnabled) {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('events-'));
            keys.forEach(key => localStorage.removeItem(key));
        }

        try {
            const response = await fetch(`${apiEndpoint}/all`, {
                method: "DELETE",
                headers: { "content-type": "application/json" },
            });

            if (response.ok) {
                if (response.status !== 204) { // Check if the response is not No Content
                    const result = await response.json();
                    console.log(result.msg);
                } else {
                    console.log('All events cleared successfully.');
                }
            } else {
                console.error('Failed to clear all events: Server responded with an error.');
            }

            if (shared && ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({
                    type: 'allCalendarCleared',
                }));
            }
        } catch (error) {
            console.error(`Failed to clear all events on the server:`, error);
        }
    }

    useEffect(() => {
        clearEvents();
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
        } catch (error) {
            console.error("Error parsing local events:", error);
        }
    };

    const createEvent = (hour) => {
        const newEventId = uuidv4();
        const newEvent = {
            id: newEventId,
            name: "",
            hour: hour,
            // y: `${(hour - 6) * 68}px`,
            color: "#ffffff",
            duration: 30,
            date: selectedDate.format("YYYY-MM-DD"),
            repeat: false,
            endDate: null,
            exceptions: [],
            repeated: false,
        };
        // console.log("Creating new event: ", newEvent)
        setEvents((prevEvents) => ({ ...prevEvents, [newEventId]: newEvent }));
        // console.log("Events: ", events)
    };

    const updateEvent = (id, updatedEvent) => {
        if (editingEvent.repeat) {
            setShowRepeatModal("Edit");
        }
        setEditingEvent(prev => ({ ...prev, ...updatedEvent }));
        editingEvent.repeated = false;
        setEvents(prevEvents => ({ ...prevEvents, [id]: updatedEvent }));
        saveEvents({ ...events, [id]: updatedEvent });
    };

    const moveEvent = (id, dy) => {
        if (events[id].repeat && !movingRepeat) {
            setMovingRepeat(true);
        }
        setEvents(prevEvents => {
            const currentEvent = prevEvents[id];
            const newHour = currentEvent.hour + dy / 68;
            const updatedEvent = {
                ...currentEvent,
                hour: newHour,
                // repeated: false,
            };
            return { ...prevEvents, [id]: updatedEvent };
        });
    };

    const snapEvent = (id, newHour) => {
        if (movingRepeat) {
            setEditingEvent(events[id]);
            setShowRepeatModal("Edit");
            setMovingRepeat(false);
        }
        setEvents(prevEvents => {
            const currentEvent = prevEvents[id];
            const updatedEvent = {
                ...currentEvent,
                hour: newHour,
            };
            return { ...prevEvents, [id]: updatedEvent };
        });
        saveEvents({ ...events, [id]: { ...events[id], hour: newHour } });
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

    const handleSaveEvent = (updatedEvent) => {
        updateEvent(updatedEvent.id, updatedEvent);
        // setShowModal(false);
    };

    const handleEventChange = (e) => {
        const { name, value } = e.target;
        setEditingEvent(prevEvent => ({
            ...prevEvent,
            [name]: name === "duration" ? parseInt(value, 10) : value,
        }));
    };

    const handleDeleteEvent = async () => {
        if (editingEvent) {
            if (editingEvent.repeat) {
                setShowRepeatModal("Delete");
            }
            const updatedEvents = { ...events };
            delete updatedEvents[editingEvent.id];
            setEvents(updatedEvents);
            saveEvents(updatedEvents);
            setShowModal(false);
        }
    };

    const changeJustThisEvent = async (change) => {
        // set the exception for this event
        if (editingEvent.id) {
            try {
                const response = await fetch(`${apiEndpoint}/exception`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        eventId: editingEvent.id,
                        date: selectedDate.format('YYYY-MM-DD'),
                    }),
                });
                const result = await response.json();
            } catch (error) {
                console.error("Error setting exception: ", error);
            }
        }

        if (events[editingEvent.id]) {
            events[editingEvent.id].repeated = false;
            events[editingEvent.id].repeat = false;
            saveEvents(events);
        }

        // close the modal
        setShowRepeatModal(false);
    }

    const changeAllFutureEvents = async (change) => {
        const endDate = selectedDate.clone().subtract(1, 'day');
        const oldEndDate = moment(editingEvent.endDate);
        if (editingEvent.id) {
            try {
                const response = await fetch(`${apiEndpoint}/enddate`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        eventId: editingEvent.id,
                        date: endDate.format('YYYY-MM-DD'),
                    }),
                });
                const result = await response.json();
            } catch (error) {
                console.error("Error setting exception: ", error);
            }
        }

        // Create a new event object with the updated properties


        if (change === "Edit") {
            // Update the events state with the new event and Delete the old event
            const newEvent = {
                ...editingEvent,
                id: uuidv4(),
                date: selectedDate.format('YYYY-MM-DD'),
                repeat: editingEvent.repeat,
                repeated: false,
                endDate: oldEndDate.format('YYYY-MM-DD'),
            };
            const updatedEvents = { ...events, [newEvent.id]: newEvent };
            delete updatedEvents[editingEvent.id];

            setEvents(updatedEvents);
        } else if (change === "Delete") {
            // Delete all future events
            const updatedEvents = { ...events };
            delete updatedEvents[editingEvent.id];
            setEvents(updatedEvents);
        }

        // Save the updated events
        saveEvents(events);

        setShowRepeatModal(false);
    };

    const onCloseModal = () => {
        setShowRepeatModal(false);
    }

    const RepeatConfirmationModal = ({ show, event, onChangeJustThis, onChangeAllFuture }) => {
        if (!show) return null;
        return (
            <Modal show={show} onHide={onCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{showRepeatModal} Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{showRepeatModal} all future instances of {event.name || "this event"}?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => onChangeJustThis(showRepeatModal)}>
                        Just this event
                    </Button>
                    <Button variant="danger" onClick={onChangeAllFuture}>
                        All future events
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    };

    useEffect(() => {
        if (importEventsData) {
            importEvents(importEventsData); // Function to process import data
        }
    }, [importEventsData]);

    const importEvents = (jsonData) => {
        try {
            const importedEvents = JSON.parse(jsonData);
            if (typeof importedEvents === 'object' && importedEvents !== null) {
                let newEvents = { ...events }; // Start with current events
                Object.keys(importedEvents).forEach(key => {
                    const event = importedEvents[key];
                    const newEventId = uuidv4();
                    const eventDate = event.date ? moment(event.date).format("YYYY-MM-DD") : selectedDate.format("YYYY-MM-DD");

                    // Calculate the y position based on the event start time
                    const startTime = moment(event.time, "hh:mm A");
                    const baseTime = moment("06:00", "hh:mm A");
                    const hoursFromBase = startTime.diff(baseTime, 'hours', true);
                    const yPosition = hoursFromBase * 68; // One hour corresponds to 68 pixels

                    newEvents[newEventId] = {
                        ...event,
                        id: newEventId,
                        date: eventDate,
                        y: `${yPosition}px`, // Set the calculated y position
                        color: event.color || "#ffffff",
                    };
                });
                console.log('Imported events:', newEvents);
                saveEventsToServer(newEvents); // Save the imported events to the server
                loadEvents(selectedDate); // Reload the events from the server
            } else {
                throw new Error("Invalid JSON data for events.");
            }
        } catch (error) {
            console.error("Failed to import events:", error);
        }
    };

    async function saveEventsToServer(updatedEvents) {
        try {
            const response = await fetch(`${apiEndpoint}/import-events`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(updatedEvents),
            });
            if (!response.ok) throw new Error('Failed to save imported events.');
            console.log('Events saved successfully to server.');
        } catch (error) {
            console.error("Failed to save imported events:", error);
        }
    }



    return (
        <>
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
                <RepeatConfirmationModal
                    show={showRepeatModal}
                    event={editingEvent}
                    onChangeJustThis={changeJustThisEvent}
                    onChangeAllFuture={() => changeAllFutureEvents(showRepeatModal)}
                />
            </div>
        </>
    );
}

export default EventsContainer;