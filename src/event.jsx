import React, { useRef, useEffect, useState } from 'react';
import interact from 'interactjs';
import PropTypes from 'prop-types';

const Event = ({ event, onMoveEvent, onSnapEvent, onEditEvent }) => {
    const eventRef = useRef(null);
    const [wasDragged, setWasDragged] = useState(false);

    useEffect(() => {
        interact(eventRef.current)
            .draggable({
                inertia: false,
                modifiers: [
                    interact.modifiers.restrict({
                        restriction: 'parent',
                        endOnly: true,
                    }),
                ],
                autoScroll: true,
                listeners: {
                    move(event) {
                        onMoveEvent(event.target.getAttribute('data-id'), event.dy);
                        setWasDragged(true);
                    },
                    end(event) {
                        const eventRect = event.target.getBoundingClientRect();
                        const timeBlocks = document.querySelectorAll('.time-block');
                        const closest = Array.from(timeBlocks).reduce((prev, curr) => {
                            const currRect = curr.getBoundingClientRect();
                            const currDist = Math.abs(currRect.top - eventRect.top);
                            const prevDist = Math.abs(prev.getBoundingClientRect().top - eventRect.top);
                            return currDist < prevDist ? curr : prev;
                        });
                        if (closest) {
                            const newY = closest.offsetTop;
                            onSnapEvent(event.target.getAttribute('data-id'), newY);
                        }
                        setTimeout(() => {
                            setWasDragged(false);
                        }, 50);
                    },
                },
            });
    }, [event, onMoveEvent, onSnapEvent]);

    const handleClick = () => {
        if (!wasDragged) {
            onEditEvent(event.id);
        }
    };

    const event_height = event.duration * 6 / 5;

    return (
        <div
            ref={eventRef}
            className="event"
            style={{
                top: event.y,
                left: '85px',
                width: 'calc(100% - 85px)',
                height: `${event_height}px`,
                textAlign: 'center',
                lineHeight: `${event_height - 10}px`,
                backgroundColor: event.color || '#fff',
            }}
            data-id={event.id}
            onClick={handleClick}
        >
            {event.name}
        </div>
    );
};

Event.propTypes = {
    event: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        y: PropTypes.string.isRequired,
        color: PropTypes.string,
        duration: PropTypes.number.isRequired,
    }).isRequired,
    onMoveEvent: PropTypes.func.isRequired,
    onSnapEvent: PropTypes.func.isRequired,
    onEditEvent: PropTypes.func.isRequired,
};

export default Event;