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
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    return (
        <>
            <BrowserRouter>
                <div className="main-container">
                    <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/planner" element={
                            <Planner apiEndpoint={"/api/events"}
                                key="planner"
                                welcomeMessage={""}
                                shared={false}
                                localStorageEnabled={false} />} />
                        <Route path="/share" element={
                            <Planner apiEndpoint={"/api/shared-events"}
                                key="shared"
                                welcomeMessage={" You're on the Shared CS 260 Calendar"}
                                shared={true}
                                localStorageEnabled={false} />} />
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
