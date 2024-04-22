import React, { useState, useEffect } from "react";
import "./planner.css";
import moment from "moment";
import { NavLink } from "react-router-dom";
import WeekNavigation from "./week-navigation";
import EventsContainer from "./events-container";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export function Planner({ apiEndpoint, welcomeMessage, shared, localStorageEnabled }) {
    const [quote, setQuote] = useState("Loading quote...");
    const [selectedDate, setSelectedDate] = useState(moment());
    const [clearEventsTrigger, setClearEventsTrigger] = useState(false);
    const [importEventsData, setImportEventsData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);


    const clearEvents = () => {
        setClearEventsTrigger(prev => prev + 1); // Change to trigger effect in EventsContainer
    };

    const triggerImport = (jsonData) => {
        setImportEventsData(jsonData); // Pass JSON data to the EventsContainer
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

    useEffect(() => {
        let interval = null;
        if (loading) {
            interval = setInterval(() => {
                setProgress(prevProgress => {
                    if (prevProgress >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prevProgress + 1;
                });
            }, 450); // Update progress every 450ms to fill 100% in 45 seconds
        } else {
            setProgress(0);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const LoadingBanner = () => {
        if (!loading) return null;
        return (
            <div id="loading-bar">
                <div style={{ width: 50, height: 50, margin: 'auto' }}>
                    <CircularProgressbar
                        value={progress}
                        id="progress-bar"
                        text={`${progress}%`}
                        styles={buildStyles({
                            pathColor: `rgba(62, 152, 199, ${progress / 100})`,
                            textColor: '#fff',
                        })}
                    />
                </div>
                <p id="loading-text">Analyzing your image... This may take up to a minute...</p>
            </div>
        );
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
            <br></br>
            <WeekNavigation
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                onGoToToday={goToToday}
                onGoToPreviousWeek={goToPreviousWeek}
                onGoToNextWeek={goToNextWeek}
                onClearEvents={clearEvents}
                onImportEvents={triggerImport}
                setLoading={setLoading}
            />
            <EventsContainer
                selectedDate={selectedDate}
                apiEndpoint={apiEndpoint}
                shared={shared}
                clearEventsTrigger={clearEventsTrigger}
                localStorageEnabled={localStorageEnabled}
                importEventsData={importEventsData} />
            <p className="quote">Fetched Quote: {quote}</p>
            <LoadingBanner />
        </div>
    );
}