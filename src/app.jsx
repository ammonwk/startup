import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './login';
import { Planner } from './planner';
import { PlannerGrid } from './planner-grid';
import { Home } from './home';
import { Signup } from './signup';
import { Header, Footer, NotFound, LiveUsers } from './app_components';
import { SharedCalendar } from './shared-calendar';

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    return (
        <>
            <BrowserRouter>
                <div className="main-container">
                    <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/planner" element={<PlannerGrid />} />
                        <Route path="/share" element={<SharedCalendar />} />
                        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    <LiveUsers />
                    <Footer />
                </div>
            </BrowserRouter>
        </>
    );
}
