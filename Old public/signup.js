async function signup(event) {
    event.preventDefault() // Prevent the form from submitting
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const response = await fetch('/api/signup', {
        method: 'POST',
        body: JSON.stringify({ username: username, password: password }),
        headers: { 'content-type': 'application/json; charset=UTF-8' },
    });
    if (response.ok) {
        localStorage.setItem("userName", username);
        window.location.href = "planner.html";
    } else {
        const body = await response.json();
        const modalEl = document.querySelector('#msgModal');
        modalEl.querySelector('.modal-body').textContent = `⚠ Error: ${body.msg}`;
        const msgModal = new bootstrap.Modal(modalEl, {});
        msgModal.show();
    }
}