document.addEventListener("DOMContentLoaded", async () => {
    try {
        await fetch("http://localhost:5000/csrf-token", {
            credentials: "include"
        });
    } catch (error) {
        console.error("Error fetching CSRF token:", error);
    }
});

document.getElementById("contactForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Retrieve CSRF token from cookies
    const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : "";
    };
    const csrfToken = getCookie("XSRF-TOKEN");

    // Retrieve reCAPTCHA response
    const recaptchaResponse = grecaptcha.getResponse();
    if (!recaptchaResponse) {
        document.getElementById("responseMessage").innerText = "Please complete the reCAPTCHA.";
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            },
            credentials: "include",
            body: JSON.stringify({ 
                name, 
                email, 
                message, 
                "g-recaptcha-response": recaptchaResponse 
            })
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
