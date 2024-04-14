import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useSettings } from './settings-provider';

export function NotFound() {
    return <main className='container-fluid bg-secondary text-center'>Error 404: Address unknown.</main>;
}

export function Header({ isLoggedIn, setIsLoggedIn }) {
    const navigate = useNavigate();
    // const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    React.useEffect(() => {
        const userName = localStorage.getItem('userName');
        setIsLoggedIn(!!userName);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userName');
        setIsLoggedIn(false);
        navigate('/login');
    };

    return (
        <header>
            <nav className="navbar navbar-expand-sm navbar-light bg-white border-bottom mx-3 my-2">
                <div className="container-fluid">
                    <NavLink className="navbar-brand" to="/">RM Planner</NavLink>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/">Home</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/planner">Planner</NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink className="nav-link" to="/share">CS 260 Shared Calendar</NavLink>
                            </li>
                            <li className="nav-item">
                                <SettingsDropdown />
                            </li>
                            {!isLoggedIn && (
                                <>
                                    <li className="nav-item">
                                        <NavLink className="nav-link me-2" to="/login">Login</NavLink>
                                    </li>
                                    <NavLink className="btn btn-outline-primary" to="/signup">Sign up</NavLink>
                                </>
                            )}
                            {isLoggedIn && (
                                <li className="nav-item">
                                    <button className="btn btn-outline-secondary" onClick={handleLogout}>Logout</button>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
}
export function Footer() {
    return (
        <footer className="mt-auto bg-light d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
            <nav aria-label="Footer legal">
                <nav aria-label="Footer legal">
                    <ul className="nav">
                        <li className="nav-item align-self-center"><span className="text-muted ms-3">© 2024 Ammon Kunzler</span>
                        </li>
                        <li className="nav-item"><a href="https://github.com/ammonwk/startup/blob/main/README.md"
                            target="_blank" className="nav-link px-2 text-muted">Github</a></li>
                    </ul>
                </nav>
            </nav>

            <nav aria-label="Footer navigation">
                <ul className="nav">
                    <li className="nav-item"><NavLink to="/" className="nav-link px-2 text-muted">Home</NavLink></li>
                    <li className="nav-item"><NavLink to="/planner" className="nav-link px-2 text-muted">Planner</NavLink></li>
                    <li className="nav-item"><NavLink to="/share" className="nav-link px-2 text-muted">CS 260 Shared Calendar</NavLink></li>
                    <li className="nav-item"><NavLink to="/login" className="nav-link px-2 text-muted">Login</NavLink></li>
                    <li className="nav-item"><NavLink to="/signup" className="nav-link px-2 me-2 text-muted">Sign up</NavLink></li>
                </ul>
            </nav>
        </footer>
    );
}

export function LiveUsers() {
    const [users, setUsers] = React.useState([]);

    React.useEffect(() => {
        const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
        const ws = new WebSocket(wsScheme + "://" + window.location.host + "/path");

        ws.onopen = function () {
            // console.log("Connected to WebSocket");
            // Check if a username is stored, otherwise set it to "anonymous"
            const username = localStorage.getItem("userName") || "anonymous";
            ws.send(JSON.stringify({ type: 'setUsername', username: username }));
        };
        ws.onmessage = function (event) {
            // console.log("Message from server:", event.data);
            const message = JSON.parse(event.data);
            if (message.type === 'userList') {
                setUsers(message.usernames);
            }
        };
    }, []);

    return (
        <div className="users position-fixed bottom-0 end-0 p-3">
            <div id="userCountBox" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown"
                aria-expanded="false">
                Live Users: <span id="userCount">{users.length}</span>
            </div>
            <ul className="dropdown-menu dropdown-menu-end" id="userList">
                {users.map((username, index) => (
                    <li key={index} className="dropdown-item">{username}</li>
                ))}
            </ul>
        </div>
    );
}

function SettingsDropdown() {
    const { settings, changeSetting } = useSettings();

    return (
        <div className="dropdown settings-dropdown">
            <button className="btn dropdown-toggle" type="button"
                id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                Settings
            </button>
            <div className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <form className="px-4 py-3">
                    <div className="mb-3">
                        <label htmlFor="themeSelector" className="form-label">
                            Theme:
                        </label>
                        <select
                            id="themeSelector"
                            className="form-select"
                            value={settings.theme}
                            onChange={(e) => changeSetting('theme', e.target.value)}
                        >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                </form>
            </div>
        </div>
    );
}
