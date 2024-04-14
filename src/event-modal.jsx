import React from "react";
import { Modal, Button, Form } from "react-bootstrap";

function EventModal({
    showModal,
    editingEvent,
    onCloseModal,
    onSaveEvent,
    onDeleteEvent,
    onEventChange,
}) {
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
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCloseModal}>
                    Close
                </Button>
                <Button variant="danger" onClick={onDeleteEvent}>
                    Delete Event
                </Button>
                <Button variant="primary" onClick={onSaveEvent}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default EventModal;