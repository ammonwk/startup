import React, { useState, useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import Calendar from "react-calendar";
import moment from "moment";

function WeekNavigation({
    selectedDate,
    onDateChange,
    onGoToToday,
    onGoToPreviousWeek,
    onGoToNextWeek,
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const getWeekStart = (date) => {
        return date.clone().startOf("week");
    };

    const daysOfWeek = (date) => {
        let weekStart = getWeekStart(date);
        return [...Array(7)].map((_, i) => weekStart.clone().add(i, "days"));
    };

    return (
        <>
            <div className="current-date-view">
                <Button variant="link" onClick={toggleDropdown}>
                    {selectedDate.format("MMMM D, YYYY")} <i className="arrow down"></i>
                </Button>
                <div className="today-button" onClick={onGoToToday}>
                    Go To Today: {moment().date()}
                </div>
                {showDropdown && (
                    <div className="dropdown-calendar" ref={dropdownRef}>
                        <Calendar value={selectedDate.toDate()} onChange={onDateChange} />
                    </div>
                )}
            </div>
            <div className="week-navigation">
                <Button variant="link" onClick={onGoToPreviousWeek}>
                    <i className="arrow left"></i>
                </Button>
                <div className="week-view">
                    {daysOfWeek(selectedDate).map((day) => (
                        <div
                            key={day}
                            className={`day${day.isSame(moment(), "day")
                                    ? " today"
                                    : day.isSame(selectedDate, "day")
                                        ? " selected-day"
                                        : ""
                                }`}
                            onClick={() => {
                                onDateChange(day);
                            }}
                        >
                            {day.format("ddd D")}
                        </div>
                    ))}
                </div>
                <Button variant="link" onClick={onGoToNextWeek}>
                    <i className="arrow right"></i>
                </Button>
            </div>
        </>
    );
}

export default WeekNavigation;