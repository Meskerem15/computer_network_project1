document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("http://localhost:5000/csrf-token", { credentials: "include" });
        const data = await response.json();
        document.getElementById("csrfToken").value = data.csrfToken;
    } catch (error) {
        console.error("Error fetching CSRF token:", error);
    }
});

document.getElementById("contactForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;
    const csrfToken = document.getElementById("csrfToken").value;

    try {
        const response = await fetch("http://localhost:5000/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            },
            credentials: "include",
            body: JSON.stringify({ name, email, message })
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById("responseMessage").innerText = result.message || "Message sent successfully!";
        } else {
            document.getElementById("responseMessage").innerText = "Error submitting the form.";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("responseMessage").innerText = "Error submitting the form.";
    }

    document.getElementById("contactForm").reset();
});
