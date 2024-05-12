import { auth } from "../chat/config.js";
import {sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const email = document.getElementById('email').value;

      // Send password reset email
      sendPasswordResetEmail(auth, email)
        .then(function () {
          // Password reset email sent
          alert('Password reset email sent. Check your inbox.');
          form.reset();
        })
        .catch(function (error) {
          // An error occurred
          console.error(error);
          alert('Failed to send password reset email. Please try again.');
        });
    });
  });