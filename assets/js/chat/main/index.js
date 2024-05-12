import { doc, getDoc, collection, query, getDocs, updateDoc, addDoc, orderBy, onSnapshot, Timestamp, setDoc, startAt, endAt } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { ref as rlRef, onDisconnect, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";
import { database, db, auth, storage } from "./../config.js";
import { fetchUserData, truncateText, uploadFile } from "./../utils.js";
import { loadChatUser, loadChatMessages, getChatsForUser } from "./../roaster/messages/index.js";
import { redirection } from "../../custom-script.js";
import { logout, setDarkModeAccordingToSystemPreference } from "./system/index.js";
import { updateUserProfile, updateUserProfileSection, updateUserProfileSidebar } from "./profile/index.js";
import { fetchUsers } from "./people/index.js";

document.addEventListener("DOMContentLoaded", () => {
    loadChatUser();
    loadChatMessages();

    document.querySelector('#logout-btn').addEventListener("click", (e) => logout(e))

    // Handle file attachment event
    document.querySelector('#attachedfile-input').addEventListener('change', async (e) => {
        const files = e.target.files;
        const fileArray = [];
        const currentUserId = localStorage.getItem('userId');
        const recipientId = localStorage.getItem('chat')
        const chatId = (recipientId > currentUserId)
            ? `${recipientId}+${currentUserId}`
            : `${currentUserId}+${recipientId}`;

        // Upload each file to Firebase Storage
        for (const file of files) {
            const fileRef = ref(storage, `uploads/${chatId}/${file.name}`); // Define storage path
            await uploadBytes(fileRef, file); // Upload the file
            const downloadURL = await getDownloadURL(fileRef); // Get the download URL

            // Store file details in an array
            fileArray.push({
                fileName: file.name,
                fileUrl: downloadURL,
                fileSize: file.size,
            });
        }

        // Create a message with the file array
        const message = {
            type: 'files',
            sender: currentUserId,
            recipient: recipientId,
            timestamp: new Date(),
            files: fileArray, // Array of file details
            seen: false
        };

        try {
            // Add the message to the 'messages' sub-collection
            const messagesCollectionRef = collection(db, `chats/${chatId}/messages`);
            await addDoc(messagesCollectionRef, message);

            console.log("Files uploaded and message sent:", fileArray);
        } catch (error) {
            console.error("Error sending message with files:", error);
        }
    });


    document.querySelector('#galleryfile-input').addEventListener('change', async (e) => {
        const files = e.target.files;
        const imageArray = [];
        const currentUserId = localStorage.getItem('userId');
        const recipientId = localStorage.getItem('chat')
        const chatId = (recipientId > currentUserId)
            ? `${recipientId}+${currentUserId}`
            : `${currentUserId}+${recipientId}`;

        // Check if there are files
        if (!files || files.length === 0) {
            console.error("No files selected.");
            return;
        }

        // Upload each image to Firebase Storage
        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                console.error("Not an image file:", file.name);
                continue; // Skip non-image files
            }

            const fileRef = ref(storage, `images/${chatId}/${file.name}`); // Define storage path for images
            await uploadBytes(fileRef, file); // Upload the image
            const downloadURL = await getDownloadURL(fileRef); // Get the download URL

            // Store image details in an array
            imageArray.push({
                fileName: file.name,
                fileUrl: downloadURL,
                fileSize: file.size,
            });
        }

        // Create a message with the image array
        const message = {
            type: 'images',
            sender: currentUserId,
            recipient: recipientId,
            timestamp: new Date(),
            images: imageArray, // Array with image details
            seen: false
        };

        try {
            // Add the message to the 'messages' sub-collection
            const messagesCollectionRef = collection(db, `chats/${chatId}/messages`);
            await addDoc(messagesCollectionRef, message);

            console.log("Images uploaded and message sent:", imageArray);
        } catch (error) {
            console.error("Error sending message with images:", error);
        }
    });


    document.querySelector('#audiofile-input').addEventListener('change', async (e) => {
        const files = e.target.files;
        const audioArray = [];
        const currentUserId = localStorage.getItem('userId');
        const recipientId = localStorage.getItem('chat')
        const chatId = (recipientId > currentUserId)
            ? `${recipientId}+${currentUserId}`
            : `${currentUserId}+${recipientId}`;

        // Check if files are selected
        if (!files || files.length === 0) {
            console.error("No files selected.");
            return;
        }

        // Upload each audio file to Firebase Storage
        for (const file of files) {
            if (!file.type.startsWith("audio/")) {
                console.error("Not an audio file:", file.name);
                continue; // Skip non-audio files
            }

            const fileRef = ref(storage, `audio/${chatId}/${file.name}`); // Define storage path for audio files
            await uploadBytes(fileRef, file); // Upload the audio file
            const downloadURL = await getDownloadURL(fileRef); // Get the download URL

            // Store audio file details in an array
            audioArray.push({
                fileName: file.name,
                fileUrl: downloadURL,
                fileSize: file.size,
            });
        }

        // Create a message with the audio array
        const message = {
            type: 'audios',
            sender: currentUserId,
            recipient: recipientId,
            timestamp: new Date(),
            audios: audioArray, // Array with audio details
            seen: false
        };

        try {
            // Add the message to the 'messages' sub-collection
            const messagesCollectionRef = collection(db, `chats/${chatId}/messages`);
            await addDoc(messagesCollectionRef, message);

            console.log("Audio files uploaded and message sent:", audioArray);
        } catch (error) {
            console.error("Error sending message with audio files:", error);
        }
    });


    // Event listener for foreground image upload
    document.getElementById("profile-foreground-img-file-input")?.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        const currentUser = auth.currentUser;

        if (file && currentUser) {
            const storagePath = `user-foregrounds/${currentUser.uid}/foreground.jpg`;

            try {
                const downloadURL = await uploadFile(file, storagePath);

                // Update Firestore with the new URL
                await updateDoc(doc(db, "users", currentUser.uid), { foregroundImageUrl: downloadURL });

                console.log("Foreground image uploaded and URL updated:", downloadURL);
                document.querySelectorAll('.profile-foreground-img').forEach(item => item.src = downloadURL)
            } catch (error) {
                console.error("Error uploading foreground image:", error);
            }
        }
    });

    // Event listener for profile image upload
    document.getElementById("profile-img-file-input")?.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        const currentUser = auth.currentUser;

        if (file && currentUser) {
            const storagePath = `user-profiles/${currentUser.uid}/profile.jpg`;

            try {
                const downloadURL = await uploadFile(file, storagePath);

                // Update Firestore with the new URL
                await updateDoc(doc(db, "users", currentUser.uid), { profileImageUrl: downloadURL });

                console.log("Profile image uploaded and URL updated:", downloadURL);
                document.querySelectorAll('.user-profile-img').forEach(item => item.src = downloadURL);
            } catch (error) {
                console.error("Error uploading profile image:", error);
            }
        }
    });

    // This function updates the profile section with Firestore data
    async function updateProfile() {
        // Default values in case no data is available


        // Get current user
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {

                    user.providerData.forEach((profile) => localStorage.setItem('provider', profile.providerId))

                    localStorage.setItem('userId', user.uid);
                    const userRef = rlRef(database, `presence/${user.uid}`);

                    // Mark as online when the user is connected
                    set(userRef, { online: true });

                    // Mark as offline and set last online time when the user disconnects
                    onDisconnect(userRef).set({
                        online: false,
                        lastOnline: Date.now()
                    });

                    getChatsForUser();

                    updateUserProfileSection(user);


                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                redirection('auth-login.html')
                console.log("No user is logged in");
            }
        });
    }


    // Event listener for the 'Edit' button to enable editing of the profile fields
    document.querySelector(".update-profile-btn")?.addEventListener("click", async function () {

        const currentUser = auth.currentUser;
        if (currentUser)
            await updateUserProfile(currentUser.uid)
        else
            console.error("No logged-in user found.")
    });




    const chatInput = document.querySelector('#chat-input');

    document.querySelector('#send-message-btn').addEventListener("click", async function (e) {
        e.preventDefault();

        if (!chatInput?.value) {
            return; // Return if there's no message to send
        }

        const recipientId = localStorage.getItem("chat");
        const currentUserId = localStorage.getItem("userId");

        if (recipientId && currentUserId) {
            // Determine the chat ID based on the lexicographically larger user ID
            const chatId = (recipientId > currentUserId)
                ? `${recipientId}+${currentUserId}`
                : `${currentUserId}+${recipientId}`;

            const message = {
                text: chatInput.value,
                sender: currentUserId,
                recipient: recipientId,
                timestamp: new Date(),
                seen: false,
            };

            try {
                // Reference to the chat document
                const chatDocRef = doc(db, `chats/${chatId}`);

                // Set the participants and last message in the chat document
                await setDoc(chatDocRef, {
                    participants: [currentUserId, recipientId], // Ensure both participants are in the array
                    lastMessage: message, // Set the last message
                }, { merge: true }); // Merge to avoid overwriting existing data

                // Reference to the 'messages' sub-collection within the chat document
                const messagesCollectionRef = collection(db, `chats/${chatId}/messages`);

                // Add the new message to the 'messages' sub-collection
                await addDoc(messagesCollectionRef, message);

                console.log(`Message sent to chat: ${chatId}`);
                // Clear the chat input after sending the message
                chatInput.value = "";
                chatInput.blur();

                getChatsForUser()
            } catch (error) {
                console.error("Error sending message:", error);
            }
        } else {
            console.error("Recipient ID or current user ID is missing.");
        }
    });


    function setTypingStatus(isTyping) {
        const currentUserId = localStorage.getItem("userId");
        const recipientId = localStorage.getItem("chat");

        if (recipientId && currentUserId) {
            const chatId = (recipientId > currentUserId)
                ? `${recipientId}+${currentUserId}`
                : `${currentUserId}+${recipientId}`;

            const chatDocRef = doc(db, `chats/${chatId}`);

            const typingField = {
                [`typing.${currentUserId}`]: isTyping, // Set the typing status for the current user
            };

            // Set or update the typing field in the chat document
            setDoc(chatDocRef, typingField, { merge: true });
        } else {
            console.error("Recipient ID or current user ID is missing.");
        }
    }

    function listenForTypingState() {
        const currentUserId = localStorage.getItem("userId");
        const recipientId = localStorage.getItem("chat");

        if (recipientId && currentUserId) {
            const chatId = (recipientId > currentUserId)
                ? `${recipientId}+${currentUserId}`
                : `${currentUserId}+${recipientId}`;

            const chatDocRef = doc(db, `chats/${chatId}`);

            // Listen to changes in the chat document to get the typing state
            onSnapshot(chatDocRef, (snapshot) => {
                const isRecipientTyping = snapshot.data()['typing.' + recipientId];
                const typingIndicator = document.querySelector(".chat-input-typing");
                if (isRecipientTyping) {
                    typingIndicator.style.display = "block"; // Show typing indicator
                } else {
                    typingIndicator.style.display = "none"; // Hide typing indicator
                }
            });
        } else {
            console.error("Recipient ID or current user ID is missing.");
        }
    }

    chatInput.addEventListener("focus", () => {
        console.log("focus")
        setTypingStatus(true);
    })

    chatInput.addEventListener("blur", () => {
        console.log("blur")
        setTypingStatus(false);
    })


    const voiceRecorderBtn = document.querySelector("#voice-recorder-btn");
    const voiceSendbutton = document.querySelector('#send-voice-message-btn');
    const voicePlayback = document.querySelector("#voice-playback");
    const voicePlaybackWrapper = document.querySelector(".voice-recording-dialog");

    voiceRecorderBtn.addEventListener("click", async () => {

        let isRecording = false;
        let mediaRecorder = null;
        let recordedChunks = [];


        let voiceBlob = '';

        if (!isRecording) {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                mediaRecorder = new MediaRecorder(stream);
                recordedChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    voiceBlob = new Blob(recordedChunks, { type: "audio/webm" });
                    const url = URL.createObjectURL(voiceBlob);



                    // Set the audio source for playback
                    voicePlayback.src = url;
                    voicePlaybackWrapper.style.display = "flex";

                    console.log("Recording stopped, audio uploaded, and message sent.");
                };

                mediaRecorder.start();
                isRecording = true;
                voiceRecorderBtn.textContent = "Stop Recording";

                console.log("Recording started.");
            } catch (error) {
                console.error("Error accessing microphone:", error);
            }
        } else {
            // Stop recording
            if (mediaRecorder) {
                mediaRecorder.stop();
            }

            isRecording = false;
            voiceRecorderBtn.textContent = "Record Voice Message";
            voicePlaybackWrapper.style.display = "none";

        }
    });


    voiceSendbutton.addEventListener("click", async () => {
        // Upload audio to Firebase Storage
        const currentUserId = localStorage.getItem("userId");
        const recipientId = localStorage.getItem("chat");

        if (recipientId && currentUserId) {
            const chatId = (recipientId > currentUserId)
                ? `${recipientId}+${currentUserId}`
                : `${currentUserId}+${recipientId}`;

            const storageRef = ref(storage, `audio/${chatId}/${Date.now()}.webm`);

            await uploadBytes(storageRef, voiceBlob); // Upload audio to Storage
            const downloadURL = await getDownloadURL(storageRef); // Get download URL

            // Send message with audio type to Firestore
            const message = {
                type: "audio",
                audioUrl: downloadURL,
                sender: currentUserId,
                recipient: recipientId,
                timestamp: new Date(),
                seen: false
            };

            await addDoc(collection(db, `chats/${chatId}/messages`), message); // Add to Firestore messages

            voicePlayback.src = '';
            voicePlaybackWrapper.style.display = "none";

        }
    })



    const showProfileBtn = document.querySelector('#show-profile');
    const showProfileMobileBtn = document.querySelector('#show-user-profile-mobile');

    showProfileBtn.addEventListener('click', () =>
        updateUserProfileSidebar(localStorage.getItem('chat')))
    showProfileMobileBtn.addEventListener('click', () =>
        updateUserProfileSidebar(localStorage.getItem('chat')))




    setDarkModeAccordingToSystemPreference()
    fetchUsers()
    updateProfile();
    listenForTypingState();

});
