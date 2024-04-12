import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useNavigate, NavLink } from 'react-router-dom';

export function Signup() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showModal, setShowModal] = React.useState(false);
    const [modalMessage, setModalMessage] = React.useState('');
    const navigate = useNavigate();

    const handleSignup = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
                headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            });

            if (response.ok) {
                localStorage.setItem('userName', username);
                navigate('/planner');
            } else {
                const body = await response.json();
                setModalMessage(`⚠ Error: ${body.msg}`);
                setShowModal(true);
            }
        } catch (error) {
            console.error('Signup error:', error);
        }
    };

    return (
        <main className="mt-2 login_display">
            <h2 className="mb-3">Sign up - Welcome!</h2>
            <p>Please make an account to continue, or <NavLink to="/login">login</NavLink> to an existing account.</p>
            <form onSubmit={handleSignup}>
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input
                        type="text"
                        className="form-control"
                        id="username"
                        placeholder="Username..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        id="password"
                        placeholder="Password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary">Sign up</button>
            </form>

            {/* Error dialog */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Body>{modalMessage}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </main>
    );
}
