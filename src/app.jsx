import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Login } from './login';
import { Planner } from './planner';
import { Home } from './home';
import { Signup } from './signup';
import { Header, Footer, NotFound, LiveUsers } from './app_components';

export default function App() {
    return (
        <>
            <BrowserRouter>
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/planner" element={<Planner />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
                <LiveUsers />
                <Footer />
            </BrowserRouter>
        </>
    );
}
