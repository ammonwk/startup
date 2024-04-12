import React, { useRef, useEffect, useState } from 'react';
import interact from 'interactjs';

const Event = ({ event, onMoveEvent, onSnapEvent, onEditEvent }) => {
    const eventRef = useRef(null);
    const [wasDragged, setWasDragged] = useState(false); // State to track if the event was dragged

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
                        setWasDragged(true); // Set wasDragged to true during movement
                    },
                    end(event) {
                        const eventRect = event.target.getBoundingClientRect();
                        const timeBlocks = document.querySelectorAll('.time-block');
                        let closest = null;
                        let closestDist = Infinity;
                        timeBlocks.forEach(block => {
                            const blockRect = block.getBoundingClientRect();
                            const dist = Math.abs(blockRect.top - eventRect.top);
                            if (dist < closestDist) {
                                closest = block;
                                closestDist = dist;
                            }
                        });
                        if (closest) {
                            const newY = closest.offsetTop;
                            onSnapEvent(event.target.getAttribute('data-id'), newY);
                        }

                        setTimeout(() => {
                            setWasDragged(false); // Reset wasDragged after the drag ends
                        }, 50); // Short delay to distinguish click from drag end
                    },
                },
            });
    }, [event, onMoveEvent, onSnapEvent]);

    const handleClick = () => {
        if (!wasDragged) { // Only trigger edit if the event was not recently dragged
            onEditEvent(event.id);
        }
    };

    return (
        <div
            ref={eventRef}
            className="event"
            style={{ top: event.y, left: '85px', width: 'calc(100% - 85px)', height: '50px', textAlign: 'center', lineHeight: '35px', backgroundColor: event.color || '#fff' }}
            data-id={event.id}
            onClick={handleClick}
        >
            {event.name}
        </div>
    );
};

export default Event;
