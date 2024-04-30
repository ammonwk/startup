import React from "react";
import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useEffect } from "react";

function EventModal({
    showModal,
    editingEvent,
    onCloseModal,
    onSaveEvent,
    onDeleteEvent,
    onEventChange,
}) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();  // Prevent default form submit behavior
                onSaveEvent();  // Trigger save event
                onCloseModal();  // Close the modal after saving
            } else if (event.key === 'Escape') {
                onCloseModal();  // Close the modal on escape key
            }
        };
        if (showModal) {
            document.addEventListener('keydown', handleKeyDown);
        }
        // Cleanup listener when component unmounts or modal is closed
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showModal, onSaveEvent, onCloseModal]);

    const [localEvent, setLocalEvent] = useState({ ...editingEvent });

    useEffect(() => {
        setLocalEvent({ ...editingEvent }); // Update local state when editingEvent changes
    }, [editingEvent]);

    const handleLocalEventChange = (e) => {
        const { name, value } = e.target;
        setLocalEvent(prev => ({
            ...prev,
            [name]: name === "duration" ? parseInt(value, 10) : value,
        }));
    };

    const handleSave = () => {
        onSaveEvent(localEvent); // Pass the local state to save function
        onCloseModal();
    };


    return (
        <Modal show={showModal} onHide={onCloseModal}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Event</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <div className="form-row">
                        <Form.Group className="form-name">
                            <Form.Label>Event Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={localEvent?.name || ""}
                                onChange={handleLocalEventChange}
                                name="name"
                                autoComplete="off"
                                placeholder="Name of Event"
                            />
                        </Form.Group>
                        <Form.Group className="form-color">
                            <Form.Label>Color</Form.Label>
                            <Form.Control
                                type="color"
                                value={localEvent?.color || "#000000"}
                                onChange={handleLocalEventChange}
                                name="color"
                            />
                        </Form.Group>
                    </div>
                    <div className="form-row">
                        <Form.Group className="form-duration">
                            <Form.Label>Duration (Mins)</Form.Label>
                            <Form.Control
                                type="number"
                                value={localEvent?.duration}
                                onChange={handleLocalEventChange}
                                name="duration"
                                min="0"
                                step="5"  // Allows increments of 5 minutes
                            />
                        </Form.Group>
                    </div>
                    <Form.Group>
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={1}
                            value={localEvent?.location || ""}
                            onChange={handleLocalEventChange}
                            name="location"
                            placeholder="Event Location"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={localEvent?.notes || ""}
                            onChange={handleLocalEventChange}
                            name="notes"
                            placeholder="Enter any notes or additional information"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Repeat</Form.Label>
                        <Form.Control
                            as="select"
                            value={localEvent?.repeat || ""}
                            onChange={handleLocalEventChange}
                            name="repeat"
                        >
                            <option value="">None</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="custom">Custom</option>
                        </Form.Control>
                    </Form.Group>

                    {localEvent?.repeat && (
                        <Form.Group>
                            <Form.Label>Repeat End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={localEvent?.endDate || ""}
                                onChange={handleLocalEventChange}
                                name="endDate"
                            />
                        </Form.Group>
                    )}

                    {localEvent?.repeat === "custom" && (
                        <Form.Group>
                            <Form.Label>Custom Repeat Pattern</Form.Label>
                            {/* Add form fields for custom repetition pattern */}
                        </Form.Group>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCloseModal}>
                    Close
                </Button>
                <Button variant="danger" onClick={onDeleteEvent}>
                    Delete
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
export default EventModal;