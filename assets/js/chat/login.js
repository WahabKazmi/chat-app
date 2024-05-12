import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { auth, db } from "./config.js";
import { redirection } from "../custom-script.js";
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

    const googleBtn = document.querySelector('#google-login');

    googleBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider); // Sign in with Google
            const user = result.user; // Authenticated user

            // Prepare user data to be stored in Firestore
            const userDocRef = doc(db, `users/${user.uid}`);
            const userData = {
                uid: user.uid,
                email: user.email,
                username: user.displayName,
                profileImageUrl: user.photoURL,
                createdAt: new Date(), // Store when the user was createdF
            };

            await setDoc(userDocRef, userData, { merge: true }); // Save or update user data in Firestore

            console.log("User signed in with Google and data stored in Firestore:", user);
            redirection('')
        } catch (error) {
            console.error("Error signing in with Google:", error);
        }
    });

});