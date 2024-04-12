import React from 'react';

const TimeBlock = ({ hour, onCreateEvent, onSnapEvent, isHalf }) => {
    const handleClick = () => {
        onCreateEvent(hour);
    };

    return (
        <div
            className={`"time-block" ${isHalf ? "half-hour" : ''}`}
            onClick={handleClick}
            data-time={hour}
        >
            {`${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`}
        </div>
    );
};

export default TimeBlock;