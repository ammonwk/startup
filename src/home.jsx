import React from 'react';

export function Home() {
    return (
        <main className='container-fluid bg-secondary text-center'>
            <div className="bg-image">
                <div className="col-md-5 p-lg-5 mx-auto my-5 text-center text-white">
                    <h1 className="display-4 font-weight-normal" id="pad-top">RM Planner - Home</h1>
                    <p className="lead font-weight-normal">Welcome, to the Areabook you've been missing so long.</p>
                    <a className="btn btn-outline-light" id="mb-6" href="signup.html">Get Started</a>
                </div>
            </div>
        </main>
    );
}
