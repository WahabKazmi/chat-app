import { doc, getDoc, collection, query, getDocs, updateDoc, addDoc, orderBy, onSnapshot, Timestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { ref as rlRef, onDisconnect, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";
import { database, db, auth, storage } from "./config.js";


document.addEventListener("DOMContentLoaded", () => {

    function listenToPresence() {
        const presenceRef = rlRef(database, "presence"); // Reference to the entire 'presence' array

        onValue(presenceRef, (snapshot) => {

            const presenceArray = snapshot.val(); // Get the whole presence array

            if (presenceArray) {
                // Convert the object to an array of users with their status
                const users = Object.entries(presenceArray).map(([userId, status]) => ({
                    userId,
                    isOnline: status.online || false,
                    lastOnline: status.lastOnline || null,
                }));


                users.forEach(user => {
                    document.querySelectorAll('.chat-message-list li .chat-user-img').forEach(item => {
                        if (item.getAttribute('data-id') === user.userId) {
                            if (user.isOnline) {
                                item.classList.remove('offline')
                                item.classList.add('online')
                            } else {
                                item.classList.remove('online')
                                item.classList.add('offline')
                            }
                        }
                    })
                });

            } else {
                console.log("Presence array is empty or not found.");
            }
        }, (error) => {
            console.error("Error listening to presence array:", error);
        });
    }
    // Function to handle file uploads
    async function uploadFile(file, storagePath) {
        const storageRef = ref(storage, storagePath);
        try {
            // Upload the file
            await uploadBytes(storageRef, file);

            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    }


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
        const defaultProfileData = {
            username: "Default Username",
            phone: "No phone number provided",
            email: "No email provided",
            location: "No location provided",
            bio: "No bio available",
            designation: "No designation available"
        };

        // Get current user
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    localStorage.setItem('userId', user.uid);
                    const userRef = rlRef(database, `presence/${user.uid}`);

                    // Mark as online when the user is connected
                    set(userRef, { online: true });

                    // Mark as offline and set last online time when the user disconnects
                    onDisconnect(userRef).set({
                        online: false,
                        lastOnline: Date.now()
                    });


                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    let profileData = userDoc.exists() ? userDoc.data() : defaultProfileData;


                    // Update the profile elements
                    document.querySelectorAll('.profile-foreground-img').forEach(item => item.src = profileData.foregroundImageUrl || "assets/images/4902908.jpg")
                    document.querySelectorAll('.user-profile-img').forEach(item => item.src = profileData.profileImageUrl || "assets/images/users/user-dummy-img.jpg")
                    document.querySelector(".fs-17").textContent = profileData.username || defaultProfileData.username;
                    document.querySelector(".text-muted.fs-14").textContent = profileData.designation || defaultProfileData.designation;
                    document.querySelector(".simplebar-content p.mb-3").textContent = profileData.bio || defaultProfileData.bio;


                    document.querySelector("#pi-name").value = profileData.username || '';
                    document.querySelector("#pi-email").value = profileData.email || '';
                    document.querySelector("#pi-phone").value = profileData.phone || '';
                    document.querySelector("#pi-location").value = profileData.location || '';

                    // Profile details section
                    const details = document.querySelector(".profile-desc");
                    const detailItems = details.querySelectorAll(".flex-grow-1 p");

                    detailItems[0].textContent = profileData.username || defaultProfileData.username;
                    detailItems[1].textContent = profileData.phone || defaultProfileData.phone;
                    detailItems[2].textContent = profileData.email || defaultProfileData.email;
                    detailItems[3].textContent = profileData.location || defaultProfileData.location;

                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                console.log("No user is logged in");
            }
        });
    }
    // Fetch users from Firestore
    async function fetchUsers() {
        // Reference to the 'users' collection
        const usersRef = collection(db, "users");

        // Fetch all documents in the collection
        const userQuery = query(usersRef);
        const userDocs = await getDocs(userQuery);

        const userList = document.getElementById("favourite-users");

        // Clear the list before inserting new items
        userList.innerHTML = "";

        // Iterate over user documents
        userDocs.forEach((doc) => {
            const user = doc.data();
            const userItem = document.createElement("li");

            userItem.innerHTML = `
        <a href="#"  data-id="${doc.id}">
            <span class="chat-user-img offline" data-id="${doc.id}">
                <img src="${user.profileImageUrl || 'https://via.placeholder.com/40'}" class="rounded-circle avatar-xs" alt="User Avatar">
                <span class="user-status"></span>
            </span>
            <span class="chat-username">${user.username || 'Unknown User'}</span>
            <span class="chat-user-message">${user.lastMessage || 'No message yet'}</span>
        </a>
    `;
            userList.appendChild(userItem);
        });

        document.querySelectorAll('.chat-user-list a').forEach(item => {
            item.addEventListener("click", (event) => {
                event.preventDefault();
                localStorage.setItem('chat', item.getAttribute('data-id'))
                loadChatUser();
                loadChatMessages();
            })
        })

        listenToPresence()
    }
    function getValidDate(timestamp) {
        if (!timestamp) {
            console.error("Invalid timestamp:", timestamp);
            return new Date(); // Return current date as a fallback
        }

        if (timestamp instanceof Timestamp) {
            return timestamp.toDate(); // Convert Firestore Timestamp to Date
        }

        if (typeof timestamp === "string" || typeof timestamp === "number") {
            const date = new Date(timestamp);
            if (isNaN(date)) {
                console.error("Invalid date conversion:", timestamp);
                return new Date(); // Return current date as fallback
            }
            return date;
        }

        console.error("Unrecognized timestamp format:", timestamp);
        return new Date(); // Fallback to current date
    }

    function loadChatMessages() {
        const chatMessagesList = document.getElementById("chat-messages-list"); // The chat conversation list
        const currentUserId = localStorage.getItem("userId");
        const recipientId = localStorage.getItem("chat");

        if (recipientId && currentUserId) {
            // Determine the chat document ID
            const chatId = (recipientId > currentUserId)
                ? `${recipientId}+${currentUserId}`
                : `${currentUserId}+${recipientId}`;

            // Query the 'messages' sub-collection, ordered by timestamp
            const messagesCollectionRef = collection(db, `chats/${chatId}/messages`);
            const messagesQuery = query(messagesCollectionRef, orderBy("timestamp"));

            // Listen for real-time updates
            onSnapshot(messagesQuery, (snapshot) => {
                chatMessagesList.innerHTML = ""; // Clear existing messages

                snapshot.forEach((doc) => {
                    const message = doc.data();
                    const isSentByCurrentUser = message.sender === currentUserId;

                    const messageItem = document.createElement("li");
                    messageItem.className = `chat-list ${isSentByCurrentUser ? "right" : "left"}`;
                    const validDate = getValidDate(message.timestamp);
                    const messageContent = `
                        <div class="conversation-list">
                            ${!isSentByCurrentUser ? `<div class="chat-avatar">
                                <img src="${message.senderAvatar || 'https://via.placeholder.com/28'}" alt="User Avatar" class="rounded-circle">
                            </div>` : ""}
                            <div class="user-chat-content">
                                <div class="ctext-wrap">
                                    <div class="ctext-wrap-content">
                                    ${message.type === 'audio' ? `<audio src="${message.audioUrl}" controls/>` : `<span class="ctext-content">${message.text}</span>`}
                                    </div>
                                </div>
                                <div class="conversation-name">
                                    <span class="chat-time">${validDate}</span>
                                </div>
                            </div>
                            ${isSentByCurrentUser ? `<div class="chat-avatar">
                                <img src="${message.senderAvatar || 'https://via.placeholder.com/28'}" alt="User Avatar" class="rounded-circle">
                            </div>` : ""}
                        </div>
                    `;

                    messageItem.innerHTML = messageContent;
                    chatMessagesList.appendChild(messageItem);
                });

                // Scroll to the bottom to display the latest message
                chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
            });
        } else {
            console.error("Missing recipient ID or current user ID.");
        }
    }



    // Function to update user information in Firestore
    async function updateUserProfile(uid, updatedData) {
        const userDocRef = doc(db, "users", uid);

        try {
            await updateDoc(userDocRef, updatedData);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        }
    }

    // Event listener for the 'Edit' button to enable editing of the profile fields
    document.querySelector(".update-profile-btn")?.addEventListener("click", async function () {
        const updatedData = {
            username: document.querySelector("#pi-name").value,
            email: document.querySelector("#pi-email").value,
            phone: document.querySelector("#pi-phone").value,
            location: document.querySelector("#pi-location").value
        };

        const currentUser = auth.currentUser;
        if (currentUser) {
            await updateUserProfile(currentUser.uid, updatedData);
        } else {
            console.error("No logged-in user found.");
        }
    });

    async function loadChatUser() {
        // Get the user ID from localStorage
        const chatUserId = localStorage.getItem('chat');

        if (chatUserId) {
            const userDocRef = doc(db, "users", chatUserId); // Reference to the Firestore document
            const userDoc = await getDoc(userDocRef); // Fetch the user data

            if (userDoc.exists()) {

                const presenceRef = rlRef(database, `presence/${chatUserId}`);

                onValue(presenceRef, (snapshot) => {
                    const status = snapshot.val();
                    const el = document.querySelector("#users-chat .chat-user-img");
                    const isOnline = status ? status.online : false;
                    if (isOnline) {
                        el.classList.remove("offline");
                        el.classList.add("online");
                        document.querySelector('.online-state-text').innerHTML = 'online';
                    }
                    else {
                        el.classList.add("offline")
                        el.classList.remove("online")
                        document.querySelector('.online-state-text').innerHTML = 'offline';
                    }
                });


                const user = userDoc.data(); // Extract the user data

                // Update the chat conversation section
                document.querySelector("#users-chat img.avatar-sm").src = user.profileImageUrl || 'https://via.placeholder.com/40';
                document.querySelector("#users-chat .user-profile-show").textContent = user.username || 'Unknown User';

                console.log("User data loaded:", user);
            } else {
                console.error("User document not found for ID:", chatUserId);
            }
        } else {
            console.error("No chat user ID found in localStorage.");
        }
    }


    const chatInput = document.querySelector('#chat-input');
    document.querySelector('#send-message-btn').addEventListener("click", async function (e) {
        e.preventDefault()
        if (!chatInput?.value) return; // Return if there's no message to send

        const recipientId = localStorage.getItem("chat");
        const currentUserId = localStorage.getItem("userId");

        if (recipientId && currentUserId) {
            // Determine the chat ID based on the larger user ID
            const chatId = (recipientId > currentUserId)
                ? `${recipientId}+${currentUserId}`
                : `${currentUserId}+${recipientId}`;

            const message = {
                text: chatInput.value,
                sender: currentUserId,
                recipient: recipientId,
                timestamp: new Date(),
            };

            try {
                // Reference to the 'messages' sub-collection within the chat document
                const messagesCollectionRef = collection(db, `chats/${chatId}/messages`);

                // Add a new message to the 'messages' sub-collection
                await addDoc(messagesCollectionRef, message);

                console.log(`Message sent to chat: ${chatId}`);
                // Clear the chat input after sending the message
                chatInput.value = "";
                chatInput.blur()
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

    let isRecording = false;
    let mediaRecorder = null;
    let recordedChunks = [];

    const voiceRecorderBtn = document.querySelector("#voice-recorder-btn");
    const voicePlayback = document.querySelector("#voice-playback");
    const voicePlaybackWrapper = document.querySelector(".voice-recording-dialog");
    const voiceSendbutton = document.querySelector('#send-voice-message-btn');
    let voiceBlob = '';

    voiceRecorderBtn.addEventListener("click", async () => {


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
            };

            await addDoc(collection(db, `chats/${chatId}/messages`), message); // Add to Firestore messages

            voicePlayback.src = '';
            voicePlaybackWrapper.style.display = "none";

        }
    })

    fetchUsers()
    updateProfile();
    loadChatUser();
    loadChatMessages();
    listenForTypingState();
});
