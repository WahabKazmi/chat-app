import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { auth, db } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {

    const registerForm = document.querySelector("form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("useremail").value;
            const username = document.getElementById("username").value;
            const password = document.getElementById("userpassword").value;

            try {
                // Create user with email and password
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Store additional user data in Firestore
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    username,
                    email: user.email,
                    created_at: new Date()
                });

                console.log("User registered and data stored in Firestore:", user);

                // You can redirect or show a success message
                window.location.replace('/dist/')

            } catch (error) {
                console.error("Error during registration:", error);
                alert("Registration failed: " + error.message);
            }
        });
    }

});