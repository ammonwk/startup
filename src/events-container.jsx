import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import TimeBlock from "./timeblock";
import Event from "./event";
import EventModal from "./event-modal";
import moment from "moment";
import { Modal, Button } from "react-bootstrap";

function EventsContainer({ selectedDate, apiEndpoint, shared, clearEventsTrigger, localStorageEnabled }) {
    const [events, setEvents] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [showRepeatModal, setShowRepeatModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
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
            y: `${(hour - 6) * 68}px`,
            color: "#ffffff",
            duration: 30,
            date: selectedDate.format("YYYY-MM-DD"),
            repeat: false,
            endDate: null,
            repeated: false,
        };
        setEvents((prevEvents) => ({ ...prevEvents, [newEventId]: newEvent }));
    };

    const updateEvent = (id, updatedEvent) => {
        if (editingEvent.repeated) {
            setShowRepeatModal("Edit");
        }
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

    async function saveEvents(updatedEvents) {
        console.log('Saving events...', updatedEvents)
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

    const handleDeleteEvent = async () => {
        if (editingEvent) {
            if (editingEvent.repeated) {
                setShowRepeatModal("Delete");
            }
            const updatedEvents = { ...events };
            delete updatedEvents[editingEvent.id];
            setEvents(updatedEvents);
            saveEvents(updatedEvents);
            setShowModal(false);
        }
    };

    const changeJustThisEvent = () => {
        console.log('Deleting just this event...');
    }

    const changeAllFutureEvents = () => {
        console.log('Deleting all future events...');
    }

    const onCloseModal = () => {
        setShowRepeatModal(false);
    }

    const RepeatConfirmationModal = ({ show, event, onDeleteJustThis, onDeleteAllFuture }) => {
        if (!show) return null;
        return (
            <Modal show={show} onHide={onCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{showRepeatModal} all future instances of {event.name || "this event"}?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onDeleteJustThis}>
                        Just this event
                    </Button>
                    <Button variant="danger" onClick={onDeleteAllFuture}>
                        All future events
                    </Button>
                </Modal.Footer>
            </Modal>
        )
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
            <RepeatConfirmationModal
                show={showRepeatModal}
                event={editingEvent}
                onChangeJustThis={changeJustThisEvent}
                onChangeAllFuture={changeAllFutureEvents}
            />
        </div>
    );
}

export default EventsContainer;