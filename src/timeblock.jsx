import React from 'react';
import PropTypes from 'prop-types';

const TimeBlock = ({ hour, onCreateEvent, onSnapEvent, isHalf, isDragging }) => {
    const handleClick = () => {
        if (!isDragging) {
            onCreateEvent(hour);
        }
    };

    return (
        <div
            className={`time-block ${isHalf ? 'half-hour' : ''} non-selectable`}
            onClick={handleClick}
            data-time={hour}
        >
            {`${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`}
        </div>
    );
};

TimeBlock.propTypes = {
    hour: PropTypes.number.isRequired,
    onCreateEvent: PropTypes.func.isRequired,
    onSnapEvent: PropTypes.func.isRequired,
    isHalf: PropTypes.bool,
    isDragging: PropTypes.bool.isRequired,
};

TimeBlock.defaultProps = {
    isHalf: false,
};

export default TimeBlock;