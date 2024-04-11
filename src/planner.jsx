import React, { useState, useEffect } from 'react';
import TimeBlock from './timeblock';
import Event from './event';
import './planner.css';

export function Planner() {
    const [events, setEvents] = useState({});
    const [nextID, setNextID] = useState(0);
    const [quote, setQuote] = useState('Loading quote...');

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
            } else {
                console.log('Failed to load events from the server. Using local data...', response.status);
                const localEvents = JSON.parse(localStorage.getItem('events')) || {};
                setEvents(localEvents);
            }
            const maxID = Object.keys(events).length > 0 ? Math.max(...Object.keys(events).map(id => parseInt(id, 10))) : -1;
            setNextID(maxID + 1);
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

    const createEvent = (hour, offsetX) => {
        const newEvent = {
            id: nextID,
            name: 'New Event',
            x: `${Math.max(offsetX - 45, 85)}px`,
            hour: hour
        };
        setEvents(prevEvents => ({ ...prevEvents, [nextID]: newEvent }));
        setNextID(prevID => prevID + 1);
        saveEvents({ ...events, [nextID]: newEvent });
    };

    const updateEvent = (id, updatedEvent) => {
        setEvents(prevEvents => ({ ...prevEvents, [id]: updatedEvent }));
        saveEvents({ ...events, [id]: updatedEvent });
    };

    const saveEvents = async (updatedEvents) => {
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        try {
            await fetch('/api/events', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(updatedEvents),
            });
        } catch {
            console.log('Failed to save events to the server. Saving locally...');
        }
    };

    const clearEvents = () => {
        localStorage.removeItem('events');
        setEvents({});
        setNextID(0);
        saveEvents({});
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
                        <TimeBlock hour={6 + index} onCreateEvent={createEvent} />
                        <TimeBlock hour={6 + index + 0.5} onCreateEvent={createEvent} isHalf />
                    </React.Fragment>
                ))}
                {Object.values(events).map(event => (
                    <Event key={event.id} event={event} onUpdateEvent={updateEvent} />
                ))}
            </div>
            <p className="quote">{quote}</p>
        </div>
    );
};
