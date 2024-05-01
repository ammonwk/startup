import React, { useRef, useEffect, useState } from 'react';
import interact from 'interactjs';
import PropTypes from 'prop-types';
import ResponsiveText from './responsive-text'

const Event = ({ event, events, onMoveEvent, onSnapEvent, onEditEvent, isDragging, setIsDragging }) => {
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
                    start() {
                        setIsDragging(true);
                    },
                    move(event) {
                        event.preventDefault();
                        onMoveEvent(event.target.getAttribute('data-id'), event.dy);
                    },
                    end(event) {
                        snapToClosest(event.target);
                    },
                },
            })
            .styleCursor(false);
    }, [event, onMoveEvent, onSnapEvent]);

    const snapToClosest = (target) => {
        const eventRect = target.getBoundingClientRect();
        const timeBlocks = document.querySelectorAll('.time-block');
        const closest = Array.from(timeBlocks).reduce((prev, curr) => {
            const currRect = curr.getBoundingClientRect();
            const currDist = Math.abs(currRect.top - eventRect.top);
            const prevDist = Math.abs(prev.getBoundingClientRect().top - eventRect.top);
            return currDist < prevDist ? curr : prev;
        });
        if (closest) { // Snap to closest time block
            const newHour = parseFloat(closest.getAttribute('data-time'), 10);
            onSnapEvent(target.getAttribute('data-id'), newHour);
        }
        setTimeout(() => {
            setIsDragging(false);
        }, 50);
    };

    useEffect(() => {
        snapToClosest(eventRef.current);
    }, []);

    const handleClick = () => {
        if (!isDragging) {
            onEditEvent(event.id);
        }
    };

    const getEventColumns = (allEvents) => {
        const columns = [];
        allEvents.forEach((currentEvent) => {
            const currentStart = parseFloat(currentEvent.hour, 10);
            const currentEnd = currentStart + (currentEvent.duration / 60) - 0.01; // Subtract 0.01 to prevent overlap
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const column = columns[i];
                const canPlace = column.every((otherEvent) => {
                    const otherStart = parseFloat(otherEvent.hour, 10);
                    const otherEnd = otherStart + (otherEvent.duration / 60) - 0.01;
                    return currentStart > otherEnd || currentEnd < otherStart;
                });
                if (canPlace) {
                    column.push(currentEvent);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push([currentEvent]);
            }
        });
        return columns;
    };

    function getTextColor(backgroundColor) {
        const color = backgroundColor.slice(1); // Remove the '#' sign
        const rgb = parseInt(color, 16); // Convert hex to decimal
        const r = (rgb >> 16) & 0xff; // Extract red
        const g = (rgb >> 8) & 0xff; // Extract green
        const b = (rgb >> 0) & 0xff; // Extract blue

        // Calculate luminance
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luminance > 140 ? '#333' : '#fff'; // Return #333 if light, #fff if dark
    }

    const calculateEventStyles = (event, columnIndex, totalColumns, eventColumns) => {
        const event_height = Math.max((event.duration * 6 / 5) - 2, 34); // Minimum height
        let eventWidth = totalColumns > 0 ? `calc((100% - 85px) / ${totalColumns})` : 'calc(100% - 85px)';
        let eventLeft = `calc(85px + ${columnIndex} * ((100% - 85px) / ${totalColumns}))`;
        let newTop = (parseFloat(event.hour, 10) - 6) * 68;

        // Expanding logic based on column availability
        const canExpand = eventColumns.slice(columnIndex + 1).every(column =>
            column.every(otherEvent => {
                const otherStart = parseFloat(otherEvent.hour, 10);
                const otherEnd = otherStart + (otherEvent.duration / 60) - 0.01;
                return parseFloat(event.hour, 10) + event_height < otherStart || parseFloat(event.hour, 10) >= otherEnd;
            })
        );

        if (canExpand) {
            const expandedColumns = totalColumns - columnIndex;
            eventWidth = `calc((${expandedColumns} * (100% - 85px)) / ${totalColumns})`;
        }

        // Check if there is a block at the same time, if so, set the top to that block
        const block = document.querySelector(`.time-block[data-time="${event.hour}"]`)
        if (block) {
            newTop = block.offsetTop;
        }

        return {
            top: newTop,
            left: eventLeft,
            width: eventWidth,
            height: `${event_height}px`,
            lineHeight: `${event_height - 10}px`,
            backgroundColor: event.color || '#fff',
            color: getTextColor(event.color || '#333'),
        };
    };


    // Calculate event columns and styles
    const eventColumns = getEventColumns(events);
    const totalColumns = eventColumns.length;
    const columnIndex = eventColumns.findIndex(column => column.some(e => e.id === event.id));
    const eventStyles = calculateEventStyles(event, columnIndex, totalColumns, eventColumns);

    return (
        <div
            ref={eventRef}
            className="event non-selectable"
            style={eventStyles}
            data-id={event.id}
            onClick={handleClick}
        >
            <ResponsiveText
                text={event.name || 'Click to change the event name.'}
                color={eventStyles.color}
                lineHeight={16}
                backgroundColor={eventStyles.backgroundColor}
            />
        </div>
    );
};

Event.propTypes = {
    event: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        hour: PropTypes.number.isRequired,
        color: PropTypes.string,
        duration: PropTypes.number.isRequired,
    }).isRequired,
    events: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            hour: PropTypes.number.isRequired,
            color: PropTypes.string,
            duration: PropTypes.number.isRequired,
            location: PropTypes.string,
            notes: PropTypes.string,
        })
    ).isRequired,
    onMoveEvent: PropTypes.func.isRequired,
    onSnapEvent: PropTypes.func.isRequired,
    onEditEvent: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    setIsDragging: PropTypes.func.isRequired,
};

export default Event;