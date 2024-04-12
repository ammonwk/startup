import React, { useRef, useEffect } from 'react';
import interact from 'interactjs';

const Event = ({ event, onMoveEvent, onSnapEvent, onEditEvent }) => {
    const eventRef = useRef(null);

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
                    },
                },
            });
    }, [event, onMoveEvent, onSnapEvent]);

    return (
        <div
            ref={eventRef}
            className={"event"}
            style={{ top: event.y, left: '85px', width: 'calc(100% - 85px)', height: '50px', textAlign: 'center', lineHeight: '35px' }}
            data-id={event.id}
        >
            {event.name}
        </div>
    );
};

export default Event;