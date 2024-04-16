import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

export function Home() {
    return (
        <main>
            <div className="bg-image">
                <div className="col-md-5 p-lg-5 mx-auto my-5 text-center text-white">
                    <h1 className="display-4 font-weight-normal" id="pad-top">RM Planner - Home</h1>
                    <p className="lead font-weight-normal">Welcome, to the Areabook you've been missing for so long.</p>
                    <NavLink className="btn btn-outline-light" id="mb-6" to="/planner">Get Started</NavLink>
                </div>
            </div>
        </main>
    );
}
