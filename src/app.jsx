import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

export default function App() {
    return (
        <>
            <header>
                <nav className="navbar navbar-expand-sm navbar-light bg-white border-bottom mx-3 my-2">
                    <div className="container-fluid">
                        <a className="navbar-brand" href="index.html">RM Planner</a>
                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                            <ul className="navbar-nav">
                                <li className="nav-item">
                                    <a className="nav-link" href="index.html">Home</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" href="planner.html">Planner</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link me-2" href="login.html">Login</a>
                                </li>
                            </ul>
                            <a className="btn btn-outline-primary" href="signup.html">Sign up</a>
                        </div>
                    </div>
                </nav>
            </header>
            <main>App components go here</main>
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
