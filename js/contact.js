document.getElementById("contact-form").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();
    const formMessages = document.getElementById("form-messages");

    formMessages.innerHTML = "";

    if (!validateName(name)) return;
    if (!validateEmail(email)) return;
    if (!validateSubject(subject)) return;
    if (!validateMessage(message)) return;

    // Handle form submission
    formMessages.style.display = "none";
    alert("Form submitted successfully");
});

function validateName(name) {
    if (name.length <= 5) {
        displayError("Name should be more than 5 characters long.");
        return false;
    }
    return true;
}

function validateEmail(email) {
    const regEx = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!regEx.test(String(email).toLowerCase())) {
        displayError("Please enter a valid email address");
        return false;
    }
    return true;
}

function validateSubject(subject) {
    if (subject.length <= 15) {
        displayError("Subject should be more than 15 characters long.");
        return false;
    }
    return true;
}

function validateMessage(message) {
    if (message.length <= 25) {
        displayError("Message should be more than 25 characters long.");
        return false;
    }
    return true;
}

function displayError(message) {
    const formMessages = document.getElementById("form-messages");
    formMessages.innerHTML += message + "<br>";
    formMessages.style.display = "block";
    formMessages.style.color = "#d4af37";
}