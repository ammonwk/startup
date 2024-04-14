import React, { useState, useEffect, useRef } from "react";
import TimeBlock from "./timeblock";
import Event from "./event";
import "./planner.css";
import { Modal, Button, Form } from "react-bootstrap";
import Calendar from "react-calendar"; // Import from react-calendar
import "react-calendar/dist/Calendar.css"; // Import default styles
import moment from "moment";
import { NavLink } from "react-router-dom";

export function Planner({ selectedDate, setSelectedDate }) {
    const [events, setEvents] = useState({});
    const [nextId, setNextId] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    // const [selectedDate, setSelectedDate] = useState(moment());
    const [showDropdown, setShowDropdown] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setEvents({});
        setNextId(0);
        loadEvents(selectedDate);
    }, [selectedDate]);

    const loadEvents = async (date) => {
        try {
            const response = await fetch(`/api/events?date=${moment(date).format("YYYY-MM-DD")}`);
            if (response.ok) {
                const loadedEvents = await response.json();
                setEvents(loadedEvents);
                localStorage.setItem(`events-${moment(date).format("YYYY-MM-DD")}`, JSON.stringify(loadedEvents));
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
            const localEvents = JSON.parse(localStorage.getItem(`events-${moment(date).format("YYYY-MM-DD")}`)) || {};
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
        localStorage.setItem(`events-${moment(selectedDate).format("YYYY-MM-DD")}`, JSON.stringify(updatedEvents));
        try {
            await fetch(`/api/events?date=${moment(selectedDate).format("YYYY-MM-DD")}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(updatedEvents),
            });
        } catch (error) {
            console.log("Failed to save events to the server. Saving locally...", error);
        }
    }

    const clearEvents = () => {
        localStorage.removeItem(`events-${selectedDate.format("YYYY-MM-DD")}`);
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
        setEditingEvent((prevEvent) => ({
            ...prevEvent,
            [name]: name === "duration" ? parseInt(value, 10) : value,
        }));
    };

    const handleDateChange = (date) => {
        setSelectedDate(moment(date));
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const goToToday = () => {
        setSelectedDate(moment());
        setShowDropdown(false);
    };

    // This function gets the start of the current week
    const getWeekStart = (date) => {
        return moment(date).clone().startOf("week");
    };

    // Generate the days for the week view
    const daysOfWeek = (date) => {
        let weekStart = getWeekStart(date);
        return [...Array(7)].map((_, i) => weekStart.clone().add(i, "days"));
    };

    const goToPreviousWeek = () => {
        setSelectedDate((prevDate) => prevDate.clone().subtract(1, "week"));
    };

    const goToNextWeek = () => {
        setSelectedDate((prevDate) => prevDate.clone().add(1, "week"));
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
        <div className="container">
            <div className="current-date-view">
                <Button variant="link" onClick={toggleDropdown}>
                    {moment(selectedDate).format("MMMM D, YYYY")} <i className="arrow down"></i>
                </Button>
                <div className="today-button" onClick={goToToday}>
                    Go To Today: {moment().date()}
                </div>
                {showDropdown && (
                    <div className="dropdown-calendar" ref={dropdownRef}>
                        <Calendar value={selectedDate.toDate()} onChange={handleDateChange} />
                    </div>
                )}
            </div>
            <div className="week-navigation">
                <Button variant="link" onClick={goToPreviousWeek}>
                    <i className="arrow left"></i>
                </Button>
                <div className="week-view">
                    {daysOfWeek(selectedDate).map((day) => (
                        <div
                            key={day}
                            className={`day${day.isSame(moment(), "day") ? " today" : day.isSame(selectedDate, "day") ? " selected-day" : ""}`}
                            onClick={() => {
                                handleDateChange(day);
                            }}
                        >
                            {day.format("ddd D")}
                        </div>
                    ))}
                </div>
                <Button variant="link" onClick={goToNextWeek}>
                    <i className="arrow right"></i>
                </Button>
            </div>
            {/* <Button variant="danger" onClick={clearEvents}>Clear</Button> */}
            <div id="events-container">
                {[...Array(17)].map((_, index) => (
                    <React.Fragment key={index}>
                        <div className="hr" />
                        <TimeBlock hour={6 + index} onCreateEvent={createEvent} onSnapEvent={snapEvent} isDragging={isDragging} />
                        <TimeBlock
                            hour={6 + index + 0.5}
                            onCreateEvent={createEvent}
                            onSnapEvent={snapEvent}
                            isHalf
                            isDragging={isDragging}
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
            </div>
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
                                value={editingEvent?.name || ""}
                                onChange={handleEventChange}
                                name="name"
                                autoComplete="off"
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Color</Form.Label>
                            <Form.Control
                                type="color"
                                value={editingEvent?.color || "#000000"}
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
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                    <Button variant="danger" onClick={handleDeleteEvent}>
                        Delete Event
                    </Button>
                    <Button variant="primary" onClick={handleSaveEvent}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
