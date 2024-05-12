import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";


const firebaseConfig = {
    apiKey: "AIzaSyAzCAl4qenW2AiIX-6UrppUofVQafY061s",
    authDomain: "html-chat-app-5884d.firebaseapp.com",
    projectId: "html-chat-app-5884d",
    storageBucket: "html-chat-app-5884d.appspot.com",
    messagingSenderId: "322524538024",
    appId: "1:322524538024:web:27b5ec835d28d1e69c0e9d",
    measurementId: "G-F0PHG1KDFL"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);