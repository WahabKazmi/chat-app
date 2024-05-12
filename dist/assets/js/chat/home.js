import { doc, getDoc, collection, query, getDocs, updateDoc, addDoc, orderBy, onSnapshot, Timestamp, setDoc, startAt, endAt } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { ref as rlRef, onDisconnect, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";
import { database, db, auth, storage } from "./config.js";
import { truncateText } from "./utils.js";
import { getChatsForUser, loadChatUser, loadChatMessages } from "./roaster.js";
import { redirection } from "../custom-script.js";


document.addEventListener("DOMContentLoaded", () => {
    loadChatUser();
    loadChatMessages();
    function setDarkModeAccordingToSystemPreference() {
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const currentMode = document.body.getAttribute("data-layout-mode");

        // Set the initial layout mode based on the system preference
        if (currentMode !== null) {
            return; // If the mode is already set, do nothing
        }

        if (prefersDarkMode) {
            document.body.setAttribute("data-layout-mode", "dark");
        } else {
            document.body.setAttribute("data-layout-mode", "light");
        }
    }


    function logout() {
        signOut(auth)
            .then(() => {
                console.log("User logged out successfully.");
                redirection('auth-login.html')
            })
            .catch((error) => {
                console.error("Error logging out:", error);
            });
    }
    document.querySelector('#logout-btn').addEventListener("click", (e) => {
        e.preventDefault()
        localStorage.setItem('userId', '')
        logout()
    })


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

                    user.providerData.forEach((profile) => {
                        localStorage.setItem('provider', profile.providerId)
                    });



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
                    document.querySelector("#pi-bio").value = profileData.bio || '';
                    document.querySelector("#pi-designation").value = profileData.designation || '';

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
                redirection('auth-login.html')
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

        const userList = document.getElementById("all-users");

        // Clear the list before inserting new items
        userList.innerHTML = "";

        // Iterate over user documents
        userDocs.forEach((userDoc) => {
            const user = userDoc.data();
            const userItem = document.createElement("li");
            const currentUserId = localStorage.getItem('userId');
            const chatId = (userDoc.id > currentUserId)
                ? `${userDoc.id}+${currentUserId}`
                : `${currentUserId}+${userDoc.id}`;


            //last message
            const currentChatDocRef = doc(db, "chats", chatId); // Reference to the Firestore document
            let lastMessageText = ''

            getDoc(currentChatDocRef).then(response => {
                lastMessageText = truncateText(response.data()?.lastMessage?.text);
            })
                .catch(error => {
                    console.log({ error })
                })

            // const lastMessageText = truncateText(lastMessage.data().lastMessage?.text);

            userItem.innerHTML = `
        <a href="#"  data-id="${userDoc.id}">
            <span class="chat-user-img offline" data-id="${userDoc.id}">
                <img src="${user.profileImageUrl || 'assets/images/users/user-dummy-img.jpg'}" class="rounded-circle avatar-xs" alt="">
            </span>
            <span class="chat-username">${user.username || 'Unknown User'}</span>
            <span class="chat-user-message">${lastMessageText}</span>
        </a>`;
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
            username: document.querySelector("#pi-name").value.toLocaleLowerCase(),
            email: document.querySelector("#pi-email").value,
            phone: document.querySelector("#pi-phone").value,
            location: document.querySelector("#pi-location").value,
            bio: document.querySelector("#pi-bio").value,
            designation: document.querySelector("#pi-designation").value
        };

        const currentUser = auth.currentUser;
        if (currentUser) {
            await updateUserProfile(currentUser.uid, updatedData);
        } else {
            console.error("No logged-in user found.");
        }
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
                seen: false
            };

            await addDoc(collection(db, `chats/${chatId}/messages`), message); // Add to Firestore messages

            voicePlayback.src = '';
            voicePlaybackWrapper.style.display = "none";

        }
    })

    // Function to fetch user data from Firestore
    async function fetchUserData(userId) {
        const userRef = doc(db, "users", userId);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
            return userSnapshot.data();
        } else {
            console.error("User not found");
            return null;
        }
    }

    // Function to update the user profile detail sidebar
    async function updateUserProfileSidebar(userId) {
        const userData = await fetchUserData(userId);
        if (!userData) return;
        console.log({ userData })
        // Update profile image
        const profileImg = document.querySelector('#show-user-profile');
        profileImg.src = userData.profileImageUrl || "assets/images/users/avatar-default.jpg";

        // Update user name
        const userName = document.querySelector('.user-name');
        userName.textContent = userData.username || "Unknown User";

        // Update user status
        const userStatus = document.querySelector('.user-profile-status');
        userStatus.innerHTML = `
        <i class="bx bxs-circle fs-10 text-${userData.online ? 'success' : 'danger'} me-1 ms-0"></i>
        ${userData.online ? 'Online' : 'Offline'}
    `;

        const statusText = document.querySelector('.status-text');
        statusText.innerHTML = userData.bio || 'N/A';

        // Update user profile description
        const profileDesc = document.querySelector('.user-profile-desc');
        const infoSection = profileDesc.querySelector('.pb-4.border-bottom');
        infoSection.innerHTML = `
        <h5 class="fs-12 text-muted text-uppercase mb-2">Info :</h5>
        <div class="d-flex align-items-center">
            <div class="flex-shrink-0">
                <i class="ri-user-line align-middle fs-15 text-muted"></i>
            </div>
            <div class="flex-grow-1 ms-3">
                <h5 class="fs-14 text-truncate mb-0">${userData.username || "Full Name"}</h5>
            </div>
        </div>

        <div class="d-flex align-items-center mt-3">
            <div class="flex-shrink-0">
                <i class="ri-mail-line align-middle fs-15 text-muted"></i>
            </div>
            <div class="flex-grow-1 ms-3">
                <h5 class="fs-14 text-truncate mb-0">${userData.email || "Email Address"}</h5>
            </div>
        </div>

        <div class="d-flex align-items-center mt-3">
            <div class="flex-shrink-0">
                <i class="ri-phone-line align-middle fs-15 text-muted"></i>
            </div>
            <div class="flex-grow-1 ms-3">
                <h5 class="fs-14 text-truncate mb-0">${userData.phone || "Phone Number"}</h5>
            </div>
        </div>

        <div class="d-flex align-items-center mt-3">
            <div class="flex-shrink-0">
                <i class="ri-mail-line align-middle fs-15 text-muted"></i>
            </div>
            <div class="flex-grow-1 ms-3">
                <h5 class="fs-14 text-truncate mb-0">${userData.address || "Address"}</h5>
            </div>
        </div>
    `;
    }


    const showProfileBtn = document.querySelector('#show-profile');
    const showProfileMobileBtn = document.querySelector('#show-user-profile-mobile');

    showProfileBtn.addEventListener('click', () =>
        updateUserProfileSidebar(localStorage.getItem('chat')))
    showProfileMobileBtn.addEventListener('click', () =>
        updateUserProfileSidebar(localStorage.getItem('chat')))




    setDarkModeAccordingToSystemPreference()
    fetchUsers()
    updateProfile();
    // loadChatUser();
    listenForTypingState();
    const provider = localStorage.getItem('provider')
    if (provider === 'password') {
        document.querySelector('#change-password-link').style.display = 'block'
    } else {
        document.querySelector('#change-password-link').style.display = 'none'
    }
});
