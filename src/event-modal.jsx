import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Col, Row } from "react-bootstrap";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

function EventModal({
    showModal,
    editingEvent,
    onCloseModal,
    onSaveEvent,
    onDeleteEvent,
}) {
    const [localEvent, setLocalEvent] = useState({ ...editingEvent });
    const [startTime, setStartTime] = useState(new Date());
    const [customRepeatType, setCustomRepeatType] = useState('days');
    const [customRepeatInterval, setCustomRepeatInterval] = useState(1);
    const [customRepeatDays, setCustomRepeatDays] = useState([]);
    const [customRepeatMonthly, setCustomRepeatMonthly] = useState('date');
    const [customRepeatWeekday, setCustomRepeatWeekday] = useState('');
    const [customRepeatWeekdayOccurrence, setCustomRepeatWeekdayOccurrence] = useState('1');

    useEffect(() => {
        if (editingEvent) {
            setLocalEvent({ ...editingEvent });
            const hours = Math.floor(editingEvent.hour);
            const minutes = Math.round((editingEvent.hour % 1) * 60);
            const newStartTime = new Date();
            newStartTime.setHours(hours, minutes, 0, 0);
            setStartTime(newStartTime);

            if (editingEvent.customRepeat) {
                setCustomRepeatType(editingEvent.customRepeat.type);
                setCustomRepeatInterval(editingEvent.customRepeat.interval);
                setCustomRepeatDays(editingEvent.customRepeat.days || []);
                setCustomRepeatMonthly(editingEvent.customRepeat.monthlyType || 'date');
                setCustomRepeatWeekday(editingEvent.customRepeat.weekday || '');
                setCustomRepeatWeekdayOccurrence(editingEvent.customRepeat.weekdayOccurrence || '');
            }
        } else {
            setLocalEvent({
                name: "",
                hour: 9,
                duration: 30,
                color: "#000000",
                repeat: "",
                endDate: "",
                location: "",
                notes: "",
            });
            const newStartTime = new Date();
            newStartTime.setHours(9, 0, 0, 0);
            setStartTime(newStartTime);
        }
    }, [editingEvent]);

    const handleLocalEventChange = (e) => {
        const { name, value } = e.target;
        setLocalEvent(prev => ({
            ...prev,
            [name]: name === "duration" ? parseInt(value, 10) : value,
        }));
    };

    const handleSave = () => {
        const updatedEvent = {
            ...localEvent,
            hour: startTime.getHours() + startTime.getMinutes() / 60,
            customRepeat: localEvent.repeat === 'custom' ? {
                type: customRepeatType,
                interval: customRepeatInterval,
                days: customRepeatDays,
                monthlyType: customRepeatMonthly,
                weekday: customRepeatWeekday,
                weekdayOccurrence: customRepeatWeekdayOccurrence,
            } : null,
        };
        onSaveEvent(updatedEvent);
        onCloseModal();
    };

    const handleStartTimeChange = (date) => {
        setStartTime(date);
    };

    const handleCustomRepeatDayToggle = (day) => {
        setCustomRepeatDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const getRepeatDescription = () => {
        const startDate = moment(startTime);
        switch (localEvent.repeat) {
            case 'daily':
                return 'every day';
            case 'weekly':
                return `every ${startDate.format('dddd')}`;
            case 'monthly':
                return `on the ${startDate.format('Do')} of every month`;
            case 'yearly':
                return `every ${startDate.format('MMMM Do')}`;
            case 'custom':
                return getCustomRepeatDescription();
            default:
                return '';
        }
    };

    const getCustomRepeatDescription = () => {
        const interval = customRepeatInterval > 1 ? `${customRepeatInterval} ` : '';
        switch (customRepeatType) {
            case 'days':
                return `every ${interval}day${customRepeatInterval > 1 ? 's' : ''}`;
            case 'weeks':
                if (customRepeatDays.length === 0) return `every ${interval}week${interval > 1 ? 's' : ''}`;
                const days = customRepeatDays.map(d => moment().day(d).format('dddd'));
                const formattedDays = days.length > 1
                    ? days.slice(0, -1).join(', ') + (days.length > 2 ? ',' : '') + ' and ' + days.slice(-1)
                    : days[0];
                return `every ${interval}week${interval > 1 ? 's' : ''} on ${formattedDays}`;
            case 'months':
                if (customRepeatMonthly === 'date') {
                    return `on the ${moment(startTime).format('Do')} every ${interval}month${customRepeatInterval > 1 ? 's' : ''}`;
                } else {
                    const occurrence = ['first', 'second', 'third', 'fourth', 'last'][parseInt(customRepeatWeekdayOccurrence) - 1];
                    const weekday = moment().day(customRepeatWeekday).format('dddd');
                    return `on the ${occurrence} ${weekday} every ${interval}month${customRepeatInterval > 1 ? 's' : ''}`;
                }
            case 'years':
                return `every ${interval}year${customRepeatInterval > 1 ? 's' : ''} on ${moment(startTime).format('MMMM Do')}`;
            default:
                return '';
        }
    };

    const handleEndTimeChange = (date) => {
        const durationMinutes = (date.getHours() * 60 + date.getMinutes()) - (startTime.getHours() * 60 + startTime.getMinutes());
        setLocalEvent(prev => ({
            ...prev,
            duration: durationMinutes
        }));
    };

    return (
        <Modal show={showModal} onHide={onCloseModal} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{editingEvent ? 'Edit Event' : 'Create Event'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <div className="form-row">
                        <Form.Group className="form-flex-1">
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
                        <Form.Group className="form-flex-0">
                            <Form.Label>Color</Form.Label>
                            <Form.Control
                                type="color"
                                value={localEvent?.color || "#000000"}
                                onChange={handleLocalEventChange}
                                name="color"
                            />
                        </Form.Group>
                    </div>
                    {localEvent?.hour && (<Form.Group>
                        <Form.Label>Start Time</Form.Label>
                        <DatePicker
                            selected={new Date(new Date().setHours(
                                Math.floor(localEvent.hour),
                                Math.round((localEvent.hour % 1) * 60),
                                0
                            ))}
                            onChange={date => handleStartTimeChange(date)}
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={30}
                            timeCaption="Time"
                            dateFormat="h:mm aa"
                            className="form-control"
                        />
                    </Form.Group>)}
                    <div className="form-row">
                        {localEvent?.hour && (
                            <Form.Group className="form-flex-1">
                                <Form.Label>End Time</Form.Label>
                                <DatePicker
                                    selected={new Date(new Date().setHours(
                                        Math.floor(localEvent.hour) + Math.floor(localEvent.duration / 60),
                                        Math.round((localEvent.hour % 1) * 60) + (localEvent.duration % 60),
                                        0
                                    ))}
                                    onChange={date => handleEndTimeChange(date)}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={30}
                                    timeCaption="Time"
                                    dateFormat="h:mm aa"
                                    className="form-control"
                                />
                            </Form.Group>
                        )}
                        <Form.Group className="form-flex-0">
                            <Form.Label>Duration</Form.Label>
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
                        <Form.Label>Repeat: {getRepeatDescription()}</Form.Label>
                        <Form.Control
                            as="select"
                            name="repeat"
                            value={localEvent?.repeat || ""}
                            onChange={handleLocalEventChange}
                        >
                            <option value="">Do not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="custom">Custom</option>
                        </Form.Control>
                        {/* <Form.Text className="text-muted">
                            {getRepeatDescription()}
                        </Form.Text> */}
                    </Form.Group>

                    {localEvent?.repeat === 'custom' && (
                        <>
                            <Form.Group>
                                <Form.Label>Repeat every</Form.Label>
                                <Row>
                                    <Col xs={3}>
                                        <Form.Control
                                            type="number"
                                            value={customRepeatInterval}
                                            onChange={(e) => setCustomRepeatInterval(parseInt(e.target.value))}
                                            min="1"
                                        />
                                    </Col>
                                    <Col xs={9}>
                                        <Form.Control
                                            as="select"
                                            value={customRepeatType}
                                            onChange={(e) => setCustomRepeatType(e.target.value)}
                                        >
                                            <option value="days">Day(s)</option>
                                            <option value="weeks">Week(s)</option>
                                            <option value="months">Month(s)</option>
                                            <option value="years">Year(s)</option>
                                        </Form.Control>
                                    </Col>
                                </Row>
                            </Form.Group>

                            {customRepeatType === 'weeks' && (
                                <Form.Group>
                                    <Form.Label>Repeat on</Form.Label>
                                    <div>
                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                                            <Form.Check
                                                inline
                                                key={day}
                                                type="checkbox"
                                                id={`repeat-day-${index}`}
                                                label={day}
                                                checked={customRepeatDays.includes(index)}
                                                onChange={() => handleCustomRepeatDayToggle(index)}
                                            />
                                        ))}
                                    </div>
                                </Form.Group>
                            )}

                            {customRepeatType === 'months' && (
                                <Form.Group>
                                    <Form.Label>Repeat on</Form.Label>
                                    <Form.Check
                                        type="radio"
                                        label={`On day ${moment(startTime).format('Do')} of every month`}
                                        name="monthlyRepeatType"
                                        checked={customRepeatMonthly === 'date'}
                                        onChange={() => setCustomRepeatMonthly('date')}
                                    />
                                    <Form.Check
                                        type="radio"
                                        label="On a specific day of the week"
                                        name="monthlyRepeatType"
                                        checked={customRepeatMonthly === 'day'}
                                        onChange={() => setCustomRepeatMonthly('day')}
                                    />
                                    {customRepeatMonthly === 'day' && (
                                        <Row className="mt-2">
                                            <Col>
                                                <Form.Control
                                                    as="select"
                                                    value={customRepeatWeekdayOccurrence}
                                                    onChange={(e) => setCustomRepeatWeekdayOccurrence(e.target.value)}
                                                >
                                                    <option value="1">First</option>
                                                    <option value="2">Second</option>
                                                    <option value="3">Third</option>
                                                    <option value="4">Fourth</option>
                                                    <option value="-1">Last</option>
                                                </Form.Control>
                                            </Col>
                                            <Col>
                                                <Form.Control
                                                    as="select"
                                                    value={customRepeatWeekday}
                                                    onChange={(e) => setCustomRepeatWeekday(e.target.value)}
                                                >
                                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                                                        <option key={day} value={index}>{day}</option>
                                                    ))}
                                                </Form.Control>
                                            </Col>
                                        </Row>
                                    )}
                                </Form.Group>
                            )}
                        </>
                    )}

                    {localEvent?.repeat && (
                        <Form.Group>
                            <Form.Label>End Repeat</Form.Label>
                            <Form.Control
                                type="date"
                                name="endDate"
                                value={localEvent?.endDate || ""}
                                onChange={handleLocalEventChange}
                            />
                        </Form.Group>
                    )}

                    <Form.Group>
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                            type="text"
                            name="location"
                            value={localEvent?.location || ""}
                            onChange={handleLocalEventChange}
                            placeholder="Enter event location"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Notes</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="notes"
                            value={localEvent?.notes || ""}
                            onChange={handleLocalEventChange}
                            placeholder="Enter any additional notes"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCloseModal}>
                    Cancel
                </Button>
                {editingEvent && (
                    <Button variant="danger" onClick={onDeleteEvent}>
                        Delete
                    </Button>
                )}
                <Button variant="primary" onClick={handleSave}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default EventModal;