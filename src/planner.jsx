import React, { useState, useEffect, useRef } from 'react';
import TimeBlock from './timeblock';
import Event from './event';
import './planner.css';
import { Modal, Button, Form } from 'react-bootstrap';
import Calendar from 'react-calendar'; // Import from react-calendar
import 'react-calendar/dist/Calendar.css'; // Import default styles
import moment from 'moment';

export function Planner() {
    const [events, setEvents] = useState({});
    const [nextId, setNextId] = useState(0);
    const [quote, setQuote] = useState('Loading quote...');
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(moment());
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setEvents({});
        setNextId(0);
        loadEvents(selectedDate);
        fetchQuote();
    }, [selectedDate]);

    const loadEvents = async (date) => {
        try {
            const response = await fetch(`/api/events?date=${date.format('YYYY-MM-DD')}`);
            if (response.ok) {
                const loadedEvents = await response.json();
                setEvents(loadedEvents);
                localStorage.setItem(`events-${date.format('YYYY-MM-DD')}`, JSON.stringify(loadedEvents));
                const maxId = Object.keys(loadedEvents).reduce((max, id) => Math.max(max, parseInt(id, 10)), 0);
                setNextId(maxId + 1);
            } else {
                console.log('Failed to load events from the server. Using local data...', response.status);
                loadLocalEvents(date);
            }
        } catch (error) {
            console.error('Error loading events:', error);
            loadLocalEvents(date);
        }
    };

    const loadLocalEvents = (date) => {
        try {
            const localEvents = JSON.parse(localStorage.getItem(`events-${date.format('YYYY-MM-DD')}`)) || {};
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
        localStorage.setItem(`events-${selectedDate.format('YYYY-MM-DD')}`, JSON.stringify(updatedEvents));
        try {
            await fetch(`/api/events?date=${selectedDate.format('YYYY-MM-DD')}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(updatedEvents),
            });
        } catch (error) {
            console.log('Failed to save events to the server. Saving locally...', error);
        }
    }, 1000);

    const clearEvents = () => {
        localStorage.removeItem(`events-${selectedDate.format('YYYY-MM-DD')}`);
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

    const handleDateChange = (date) => {
        setSelectedDate(moment(date));
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const goToToday = () => {
        setSelectedDate(moment());
        setShowDropdown(false);
    };

    // This function gets the start of the current week
    const getWeekStart = (date) => {
        return date.clone().startOf('week');
    };

    // Generate the days for the week view
    const daysOfWeek = (date) => {
        let weekStart = getWeekStart(date);
        return [...Array(7)].map((_, i) => weekStart.clone().add(i, 'days'));
    };

    return (
        <div className="container">
            <h2 className="welcome">Welcome. Please log in.</h2>
            <h3>Weekly Schedule</h3>
            <p>Your changes are automatically saved to the cloud. Try accessing the site on your phone to see the same events you've just made.</p>
            <div className="current-date-view">
                <Button variant="link" onClick={toggleDropdown}>
                    {selectedDate.format('MMMM D, YYYY')}
                </Button>
                <div className="today-button" onClick={goToToday}>
                    {moment().date()}
                </div>
                {showDropdown && (
                    <div className="dropdown-calendar" ref={dropdownRef}>
                        <Calendar
                            value={selectedDate.toDate()}
                            onChange={handleDateChange}
                        />
                    </div>
                )}
            </div>
            <div className="week-view">
                {daysOfWeek(selectedDate).map((day) => (
                    <div
                        key={day}
                        className={`day${day.isSame(moment(), 'day') ? ' today' : day.isSame(selectedDate, 'day') ? ' selected-day' : ''}`}
                        onClick={() => {
                            handleDateChange(day)
                        }}
                    >
                        {day.format('ddd D')}
                    </div>
                ))}
            </div>
            <Button variant="danger" onClick={clearEvents}>Clear</Button>
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
                                autocomplete="off"
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