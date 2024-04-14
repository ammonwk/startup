import React from "react";
import { Planner } from "./planner";
import "./plannergrid.css";
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import moment from "moment";
import { useSettings } from "./settings-provider";

export function PlannerGrid() {
    const { settings } = useSettings();
    const [numberOfPlanners, setNumberOfPlanners] = useState(1);
    const [selectedDate, setSelectedDate] = useState(moment());
    const [quote, setQuote] = useState("Loading quote...");

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

    useEffect(() => {
        fetchQuote();
        const calculateNumberOfPlanners = () => {
            if (settings.multiplePlanners) {
                const plannerWidth = 450 / settings.comfiness;
                console.log(Math.min(plannerWidth - 50, 300))
                const numberOfPlanners = Math.max(Math.floor(window.innerWidth / plannerWidth), 1);
                document.documentElement.style.setProperty('--planner-width', `${Math.min(window.innerWidth / numberOfPlanners - 50 / (settings.comfiness * 6), 600)}px`);
                setNumberOfPlanners(numberOfPlanners);
            } else {
                setNumberOfPlanners(1);
                document.documentElement.style.setProperty('--planner-width', `600px`);
                console.log(document.documentElement.style.getPropertyValue('--planner-width'))
            }
        };

        calculateNumberOfPlanners(); // Calculate the number of planners initially

        const handleResize = () => {
            calculateNumberOfPlanners(); // Recalculate the number of planners on window resize
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [settings.multiplePlanners, settings.comfiness]);

    const calculatePlannerDate = (index) => {
        const offset = Math.floor(numberOfPlanners / 2);
        const diff = index - offset;
        return moment(selectedDate).add(diff, "days").toDate();
    };



    return (
        <>
            <div className="planner-header">
                <h2 className="welcome">
                    Welcome
                    {localStorage.getItem("userName")
                        ? `, ${localStorage.getItem("userName")}.`
                        : ". Please log in to save your events."}
                </h2>
                <h3>Weekly Schedule</h3>
                <div>
                    {localStorage.getItem("userName")
                        ? <p>Your changes are automatically saved to the cloud. Try accessing the site on your phone to see the same events you've just made.</p>
                        : <div>
                            <div className="alert alert-danger" role="alert">
                                WATCH OUT: You are not logged in. Your changes will not be saved. <NavLink to="/login">Log in</NavLink> or <NavLink to="/signup">sign up</NavLink> to save your events.
                            </div>
                        </div>
                    }
                </div>
            </div>
            <div className="planner-grid">
                {[...Array(numberOfPlanners)].map((_, index) => (
                    <Planner
                        selectedDate={calculatePlannerDate(index)}
                        setSelectedDate={setSelectedDate}
                        key={index}
                    />
                ))}
            </div>
            <p className="quote">Fetched Quote: {quote}</p>
        </>
    );
}