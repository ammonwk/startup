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
    setLoading
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
        if (!file) return;

        // Make sure the file is under 10MB
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB. Please select a smaller file.');
            return;
        }

        const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff", "image/heic"];
        if (!allowedImageTypes.includes(file.type)) {
            alert(`${file.type} is an invalid file type. Please upload a jpg, png, gif, bmp, tiff, or heic image file.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Convert and optionally compress the image
                const targetFormat = 'image/jpeg'; // You can choose 'image/png' if you prefer
                const quality = 1; // Compression quality for JPEG (0-1 scale, with 1 being the highest quality)
                const base64Image = canvas.toDataURL(targetFormat, quality).split(',')[1];

                try {
                    setLoading(true);
                    const response = await fetch('/api/gpt-parse-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image_data: base64Image,
                        }),
                    });
                    const data = await response.json();
                    previewImportEvents(data);
                } catch (error) {
                    console.error('Error processing the image file.');
                    alert(`Error: ${error.message}`);
                    setLoading(false);
                } finally {
                    event.target.value = ''; // Clear the input field to allow for re-uploads
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
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
        } finally {
            setLoading(false);
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