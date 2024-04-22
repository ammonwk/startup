import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Dropdown } from "react-bootstrap";
import Calendar from "react-calendar";
import moment from "moment";


function WeekNavigation({
    selectedDate,
    onDateChange,
    onGoToToday,
    onGoToPreviousWeek,
    onGoToNextWeek,
    onClearEvents,
    onImportEvents,
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [previewEvents, setPreviewEvents] = useState(null);
    const dropdownRef = useRef(null);


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

    const getWeekStart = (date) => {
        return date.clone().startOf("week");
    };

    const daysOfWeek = (date) => {
        let weekStart = getWeekStart(date);
        return [...Array(7)].map((_, i) => weekStart.clone().add(i, "days"));
    };

    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Image = e.target.result.split(',')[1]; // Remove the header part from the result
                try {
                    console.log("Uploading image...")
                    const response = await fetch('/api/gpt-parse-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image_data: base64Image, // Send only the base64 part to match your backend handling
                        }),
                    });
                    const data = await response.json();
                    // Here you could update state or alert the user with the response
                    console.log(data); // Log or handle the response data
                    const jsonData = data; // Assuming the response is a JSON object
                    previewImportEvents(jsonData); // Pass the JSON data up to the parent to handle
                    event.target.value = ''; // Clear the input after reading
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('Failed to process image');
                }
            };
            reader.readAsDataURL(file);
            event.target.value = ''; // Clear the input after reading
        } else {
            console.error('Please upload a valid image file (JPEG or PNG).');
            alert('Invalid file type. Please select a JPEG or PNG image.');
        }
    };

    const previewImportEvents = (jsonData) => {
        try {
            const parsedEvents = JSON.parse(jsonData);
            if (typeof parsedEvents === 'object' && parsedEvents !== null) {
                setPreviewEvents(parsedEvents);
                setShowImportModal(true);
            } else {
                throw new Error("Invalid JSON data for events.");
            }
        } catch (error) {
            console.error("Failed to parse events for preview:", error);
            setShowImportModal(false);
        }
    };

    const ImportConfirmationModal = ({ show, onConfirm, onCancel }) => {
        if (!show || !previewEvents) return null;
        return (
            <Modal show={show} onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Import</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to import the following events?</p>
                    <ul>
                        {Object.entries(previewEvents).map(([id, event]) => (
                            <li key={id}>{event.name} on {event.date} at {event.time}</li>
                        ))}
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" onClick={() => onConfirm(previewEvents)}>Import</Button>
                </Modal.Footer>
            </Modal>
        );
    };

    const handleConfirmImport = (eventsToImport) => {
        onImportEvents(JSON.stringify(eventsToImport)); // Use the importEvents function here
        setShowImportModal(false);
    };

    const handleCancelImport = () => {
        setShowImportModal(false);
    };


    return (
        <>
            <ImportConfirmationModal
                show={showImportModal}
                onConfirm={handleConfirmImport}
                onCancel={handleCancelImport}
            />
            <div className="planner-menu">
                <Button className="menu-button" variant="link" onClick={toggleDropdown}>
                    {selectedDate.format("MMMM D, 'YY")} <i className="arrow down"></i>
                </Button>
                <Button className="today-button" onClick={onGoToToday}>
                    To Today
                </Button>
                {showDropdown && (
                    <div className="dropdown-calendar" ref={dropdownRef}>
                        <Calendar value={selectedDate.toDate()} onChange={onDateChange} />
                    </div>
                )}
                <Dropdown>
                    <Dropdown.Toggle className="menu-button" variant="link" id="dropdown-basic">
                        Actions
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={onClearEvents}>Clear Today's Events</Dropdown.Item>
                        <Dropdown.Item onClick={() => document.getElementById('imageInput').click()}>
                            Import Events from Image
                        </Dropdown.Item>
                        <input type="file" id="imageInput" style={{ display: 'none' }} accept="image/jpeg, image/png" onChange={handleFileImport} />
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            <div className="week-navigation">
                <Button variant="link" onClick={onGoToPreviousWeek}>
                    <i className="arrow left"></i>
                </Button>
                <div className="week-view">
                    {daysOfWeek(selectedDate).map((day) => (
                        <div
                            key={day}
                            className={`day${day.isSame(moment(), "day")
                                ? " today"
                                : day.isSame(selectedDate, "day")
                                    ? " selected-day"
                                    : ""
                                } non-selectable`}
                            onClick={() => {
                                onDateChange(day);
                            }}
                        >
                            {day.format("ddd D")}
                        </div>
                    ))}
                </div>
                <Button variant="link" onClick={onGoToNextWeek}>
                    <i className="arrow right"></i>
                </Button>
            </div>
        </>
    );
}

export default WeekNavigation;