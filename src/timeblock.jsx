import React from 'react';

const TimeBlock = ({ hour, onCreateEvent, isHalf }) => {
    const handleClick = (e) => {
        onCreateEvent(hour, e.nativeEvent.offsetX);
    };

    return (
        <div
            className={`time-block ${isHalf ? 'half-hour' : ''}`}
            onClick={handleClick}
            data-time={hour}
        >
            {`${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`}
        </div>
    );
};

export default TimeBlock;