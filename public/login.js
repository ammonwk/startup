// Shamelessly copied from the simon javascript github repo
function login(event) {
    event.preventDefault()
    console.log("login");
    const nameEl = document.querySelector("#name");
    localStorage.setItem("userName", nameEl.value);
    window.location.href = "planner.html";
}
