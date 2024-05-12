import { createUserWithEmailAndPassword, signInWithPopup  } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { auth, db } from "./config.js";
import { redirection } from "../custom-script.js";

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
                redirection('')

            } catch (error) {
                console.error("Error during registration:", error);
                alert("Registration failed: " + error.message);
            }
        });
    }

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
        createdAt: new Date(), // Store when the user was created
      };

      await setDoc(userDocRef, userData, { merge: true }); // Save or update user data in Firestore

      console.log("User signed in with Google and data stored in Firestore:", user);
      redirection('')

    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
    })

});