import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './login';
import { Planner } from './planner';
import { Home } from './home';
import { Signup } from './signup';

export default function App() {
    return (
        <>
            <BrowserRouter>
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
                                        <NavLink className="nav-link me-2" to="/login">Login</NavLink>
                                    </li>
                                </ul>
                                <NavLink className="btn btn-outline-primary" to="/signup">Sign up</NavLink>
                            </div>
                        </div>
                    </nav>
                </header>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/planner" element={<Planner />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                </Routes>
            </BrowserRouter>
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
                        <li className="nav-item"><a href="index.html" className="nav-link px-2 text-muted">Home</a></li>
                        <li className="nav-item"><a href="planner.html" className="nav-link px-2 text-muted">Planner</a></li>
                        <li className="nav-item"><a href="login.html" className="nav-link px-2 text-muted">Login</a></li>
                        <li className="nav-item"><a href="#" className="nav-link px-2 me-2 text-muted">About</a></li>
                    </ul>
                </nav>
            </footer>
        </>
    );
}
