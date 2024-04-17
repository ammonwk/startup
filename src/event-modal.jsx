import React from "react";
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

    return (
        <Modal show={showModal} onHide={onCloseModal}>
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
                            onChange={onEventChange}
                            name="name"
                            autoComplete="off"
                            placeholder="Name of Event"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Color</Form.Label>
                        <Form.Control
                            type="color"
                            value={editingEvent?.color || "#000000"}
                            onChange={onEventChange}
                            name="color"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Duration (Minutes)</Form.Label>
                        <Form.Control
                            type="number"
                            value={editingEvent?.duration}
                            onChange={onEventChange}
                            name="duration"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={1}
                            value={editingEvent?.location || ""}
                            onChange={onEventChange}
                            name="location"
                            placeholder="Event Location"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={editingEvent?.notes || ""}
                            onChange={onEventChange}
                            name="notes"
                            placeholder="Enter any notes or additional information"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Repeat</Form.Label>
                        <Form.Control
                            as="select"
                            value={editingEvent?.repeat || ""}
                            onChange={onEventChange}
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

                    {editingEvent?.repeat && (
                        <Form.Group>
                            <Form.Label>Repeat End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={editingEvent?.endDate || ""}
                                onChange={onEventChange}
                                name="endDate"
                            />
                        </Form.Group>
                    )}

                    {editingEvent?.repeat === "custom" && (
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
                <Button variant="primary" onClick={onSaveEvent}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
export default EventModal;