import React, { useState, useEffect } from 'react';
import TimeBlock from './timeblock';
import Event from './event';
import './planner.css';
import { Modal, Button, Form } from 'react-bootstrap';

export function Planner() {
    const [events, setEvents] = useState({});
    const [nextID, setNextID] = useState(0);
    const [quote, setQuote] = useState('Loading quote...');
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    useEffect(() => {
        loadEvents();
        fetchQuote();
    }, []);

    const loadEvents = async () => {
        try {
            const response = await fetch('/api/events');
            if (response.ok) {
                const loadedEvents = await response.json();
                setEvents(loadedEvents);
                localStorage.setItem('events', JSON.stringify(loadedEvents));
                const maxID = Object.keys(loadedEvents).length > 0 ? Math.max(...Object.keys(loadedEvents).map(id => parseInt(id, 10))) : -1;
                setNextID(maxID + 1);
            } else {
                console.log('Failed to load events from the server. Using local data...', response.status);
                const localEvents = JSON.parse(localStorage.getItem('events')) || {};
                setEvents(localEvents);
                const maxID = Object.keys(localEvents).length > 0 ? Math.max(...Object.keys(localEvents).map(id => parseInt(id, 10))) : -1;
                setNextID(maxID + 1);
            } // This duplicated code is necessary because of the async fetch request
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };


    const fetchQuote = async () => {
        try {
            const response = await fetch('https://api.api-ninjas.com/v1/quotes?category=faith', {
                method: 'GET',
                headers: {
                    'X-Api-Key': 'mSk7rfR5LnbL1FtY21YE8Q==pDgGWJtNnmVdIInG',
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const result = await response.json();
                setQuote(`"${result[0].quote}" - ${result[0].author}.`);
            } else {
                throw new Error('Network response was not ok', response.status);
            }
        } catch (error) {
            console.error('Error fetching quote:', error);
        }
    };

    const createEvent = (hour) => {
        const newEvent = {
            id: nextID,
            name: 'New Event',
            y: `${(hour - 6) * 50}px`,
        };
        setEvents(events => ({ ...events, [nextID]: newEvent }));
        setNextID(prevID => prevID + 1);
        saveEvents({ ...events, [nextID]: newEvent });
    };

    const updateEvent = (id, updatedEvent) => {
        setEvents(events => ({ ...events, [id]: updatedEvent }));
        saveEvents({ ...events, [id]: updatedEvent });
    };

    const moveEvent = (id, dy) => {
        setEvents(events => {
            const currentEvent = events[id];
            const currentY = parseFloat(currentEvent.y);
            const updatedEvent = {
                ...currentEvent,
                y: `${currentY + dy}px`,
            };
            return { ...events, [id]: updatedEvent };
        });
    };

    const snapEvent = (id, newY) => {
        setEvents(events => {
            const currentEvent = events[id];
            const updatedEvent = {
                ...currentEvent,
                y: `${newY}px`,
            };
            return { ...events, [id]: updatedEvent };
        });
        saveEvents({ ...events, [id]: { ...events[id], y: `${newY}px` } });
    };

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const saveEvents = debounce(async (events) => {
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
    }, 1000); // Debounce the save function to prevent multiple calls in a short time

    const clearEvents = () => {
        localStorage.removeItem('events');
        setEvents({});
        setNextID(0);
        saveEvents({});
    };

    const handleEditEvent = (id) => {
        setShowModal(true);
        setEditingEvent({ ...events[id] });
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
        setEditingEvent(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="container">
            <h2 className="welcome">Welcome. Please log in.</h2>
            <h3>Weekly Schedule</h3>
            <p>Your changes are automatically saved to the cloud. Try accessing the site on your phone to see the same events you've just made.</p>
            <button onClick={clearEvents} className="btn btn-primary">Clear</button>
            <div id="events-container">
                {[...Array(17)].map((_, index) => (
                    <React.Fragment key={index}>
                        <div className={"hr"} />
                        <TimeBlock hour={6 + index} onCreateEvent={createEvent} onSnapEvent={snapEvent} />
                        <TimeBlock hour={6 + index + 0.5} onCreateEvent={createEvent} onSnapEvent={snapEvent} isHalf />
                    </React.Fragment>
                ))}
                {Object.values(events).map(event => (
                    <Event
                        key={event.id}
                        event={event}
                        onMoveEvent={moveEvent}
                        onSnapEvent={snapEvent}
                        onEditEvent={handleEditEvent}
                    />
                ))}
            </div>
            <p className="quote">{quote}</p>
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Event</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Event Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={editingEvent?.name || ''}
                                onChange={handleEventChange}
                                name="name"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Color</Form.Label>
                            <Form.Control
                                type="color"
                                value={editingEvent?.color || '#000000'}
                                onChange={handleEventChange}
                                name="color"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Duration (Minutes)</Form.Label>
                            <Form.Control
                                type="number"
                                value={editingEvent?.duration || 30}
                                onChange={handleEventChange}
                                name="duration"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                    <Button variant="primary" onClick={handleSaveEvent}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};