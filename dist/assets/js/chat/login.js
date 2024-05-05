import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { auth } from "./config.js";
document.addEventListener("DOMContentLoaded", () => {


    const loginForm = document.querySelector(".login-form");
    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault(); // Prevent the default form submission behavior

        const email = document.querySelector("#username").value;
        const password = document.querySelector("#password-input").value;
        console.log({ email, password })
        try {
            // Log in with Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User logged in:", userCredential.user);

            // Redirect or perform other actions upon successful login
            window.location.href = "/dist/"; // Redirect to the desired page
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed: " + error.message); // Display an error message
        }
    });

});