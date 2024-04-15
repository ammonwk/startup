import React, { useState, useEffect } from "react";
import "./planner.css";
import moment from "moment";
import { NavLink } from "react-router-dom";
import WeekNavigation from "./week-navigation";
import EventsContainer from "./events-container";

export function Planner({ apiEndpoint, welcomeMessage, shared }) {
    const [quote, setQuote] = useState("Loading quote...");
    const [selectedDate, setSelectedDate] = useState(moment());
    const [clearEventsTrigger, setClearEventsTrigger] = useState(false);

    const clearEvents = () => {
        setClearEventsTrigger(prev => !prev); // Toggle to trigger effect in EventsContainer
    };

    useEffect(() => {
        fetchQuote();
    }, []);

    const fetchQuote = async () => {
        try {
            const response = await fetch("https://api.api-ninjas.com/v1/quotes?category=faith", {
                method: "GET",
                headers: {
                    "X-Api-Key": "mSk7rfR5LnbL1FtY21YE8Q==pDgGWJtNnmVdIInG",
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const result = await response.json();
                setQuote(`"${result[0].quote}" - ${result[0].author}.`);
            } else {
                throw new Error("Network response was not ok", response.status);
            }
        } catch (error) {
            console.error("Error fetching quote:", error);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(moment(date));
    };

    const goToToday = () => {
        setSelectedDate(moment());
    };

    const goToPreviousWeek = () => {
        setSelectedDate((prevDate) => prevDate.clone().subtract(1, "week"));
    };

    const goToNextWeek = () => {
        setSelectedDate((prevDate) => prevDate.clone().add(1, "week"));
    };

    return (
        <div className="container">
            <h2 className="welcome">
                Welcome
                {localStorage.getItem("userName")
                    ? `, ${localStorage.getItem("userName")}.`
                    : ". Please log in to save your events."}
                {welcomeMessage}
            </h2>
            <h3>Weekly Schedule</h3>
            <div>
                {!shared ? localStorage.getItem("userName")
                    ? <p>Your changes are automatically saved to the cloud. Try accessing the site on your phone to see the same events you've just made.</p>
                    : <div>
                        <div className="alert alert-danger" role="alert">
                            WATCH OUT: You are not logged in. Your changes will not be saved. <NavLink to="/login">Log in</NavLink> or <NavLink to="/signup">sign up</NavLink> to save your events.
                        </div>
                    </div> : "Your changes are automatically synced with everyone else using the Calendar."
                }
            </div>
            <WeekNavigation
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                onGoToToday={goToToday}
                onGoToPreviousWeek={goToPreviousWeek}
                onGoToNextWeek={goToNextWeek}
                onClearEvents={clearEvents}
            />
            <EventsContainer selectedDate={selectedDate} apiEndpoint={apiEndpoint} shared={shared} clearEventsTrigger={clearEventsTrigger} />
            <p className="quote">Fetched Quote: {quote}</p>
        </div>
    );
}