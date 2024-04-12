import React, { useState, useEffect } from 'react';
import TimeBlock from './timeblock';
import Event from './event';
import './planner.css';
import { Modal, Button, Form } from 'react-bootstrap';

export function Planner() {
    const [events, setEvents] = useState({});
    const [nextId, setNextId] = useState(0);
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
                const maxId = Object.keys(loadedEvents).reduce((max, id) => Math.max(max, parseInt(id, 10)), 0);
                setNextId(maxId + 1);
            } else {
                console.log('Failed to load events from the server. Using local data...', response.status);
                loadLocalEvents();
            }
        } catch (error) {
            console.error('Error loading events:', error);
            loadLocalEvents();
        }
    };

    const loadLocalEvents = () => {
        try {
            const localEvents = JSON.parse(localStorage.getItem('events')) || {};
            setEvents(localEvents);
            const maxId = Object.keys(localEvents).reduce((max, id) => Math.max(max, parseInt(id, 10)), 0);
            setNextId(maxId + 1);
        } catch (error) {
            console.error('Error parsing local events:', error);
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
            id: nextId,
            name: 'New Event',
            y: `${(hour - 6) * 60}px`,
            color: '#ffffff',
            duration: 30,
        };
        setEvents(prevEvents => ({ ...prevEvents, [nextId]: newEvent }));
        setNextId(prevId => prevId + 1);
        saveEvents({ ...events, [nextId]: newEvent });
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

    const debounce = (func, wait) => {
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

    const saveEvents = debounce(async (updatedEvents) => {
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        try {
            await fetch('/api/events', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(updatedEvents),
            });
        } catch (error) {
            console.log('Failed to save events to the server. Saving locally...', error);
        }
    }, 1000);

    const clearEvents = () => {
        localStorage.removeItem('events');
        setEvents({});
        setNextId(0);
        saveEvents({});
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
            [name]: name === 'duration' ? parseInt(value, 10) : value,
        }));
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
                        <div className="hr" />
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
}