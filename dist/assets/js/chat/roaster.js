import { deleteDoc, collection, query, where, orderBy, getDocs, getDoc, doc, onSnapshot, Timestamp, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { ref as rlRef, onDisconnect, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { database, db, auth, storage } from "./config.js";



// Get the currently logged-in user ID
const currentUserId = localStorage.getItem('userId'); // Replace with actual user ID
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

            console.log('usrs ===>', users)


            users.forEach(user => {
                document.querySelectorAll('.chat-message-list li .chat-user-img').forEach(item => {
                    console.log('inside loop')
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

function formatDate(timestamp) {
    // Convert the given timestamp into a valid JavaScript Date object
    const date = getValidDate(timestamp);

    // Get today's date and set its time to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to compare only the date

    // Get the current date from the input timestamp and set its time to midnight
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);

    const isToday = today.getTime() === inputDate.getTime(); // Check if the input date is today

    if (isToday) {
        // If it's today's date, return the formatted time
        return new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
        }).format(date);
    } else {
        // If it's not today, return a short date format
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(date);
    }
}


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
            document.querySelector("#users-chat img.avatar-sm").src = user.profileImageUrl || 'assets/images/users/user-dummy-img.jpg';
            document.querySelector("#users-chat .user-profile-show").textContent = user.username || 'Unknown User';

            console.log("User data loaded:", user);
        } else {
            console.error("User document not found for ID:", chatUserId);
        }
    } else {
        console.error("No chat user ID found in localStorage.");
    }
}

// Function to add a reaction to a message
async function addReactionToMessage(messageId, reactionEmoji) {
    const recipientId = localStorage.getItem('chat');
    const currentUserId = localStorage.getItem('userId');
    const chatId = (recipientId > currentUserId)
        ? `${recipientId}+${currentUserId}`
        : `${currentUserId}+${recipientId}`;

    try {
        const messageDocRef = doc(db, `chats/${chatId}/messages/${messageId}`);
        const messageDocSnapshot = await getDoc(messageDocRef);

        if (messageDocSnapshot.exists()) {
            const messageData = messageDocSnapshot.data();
            const reactions = messageData.reactions || [];

            // Check if the user has already reacted to the message
            const userReactionIndex = reactions.findIndex(item => item.userId === currentUserId);

            // If the user has already reacted, update their existing reaction
            if (userReactionIndex !== -1) {
                reactions[userReactionIndex] = {
                    userId: currentUserId,
                    emoji: reactionEmoji,
                    timestamp: new Date()
                };
            } else {
                // If the user has not reacted, add a new reaction
                reactions.push({
                    userId: currentUserId,
                    emoji: reactionEmoji,
                    timestamp: new Date()
                });
            }

            // Update the reactions array in the message document
            await updateDoc(messageDocRef, { reactions });

            console.log(`Reaction '${reactionEmoji}' added to message: ${messageId}`);
        } else {
            console.error(`Message ${messageId} does not exist in chat ${chatId}`);
        }
    } catch (error) {
        console.error("Error adding reaction:", error);
    }
}


// Event delegation for dynamically rendered elements
document.addEventListener("click", async (event) => {
    const target = event.target;
    const userId = localStorage.getItem('userId');
    const recipientId = localStorage.getItem('chat');
    const chatId = (recipientId > currentUserId)
        ? `${recipientId}+${currentUserId}`
        : `${currentUserId}+${recipientId}`;

    // Check if the clicked element is part of the reaction bar
    if (target.closest(".hstack")) {
        const emojiElement = target.closest("a"); // The clicked emoji
        if (emojiElement) {
            const reactionEmoji = emojiElement.textContent.trim(); // Get the reaction emoji
            const messageId = emojiElement.getAttribute('data-id'); // Replace with the correct message ID

            await addReactionToMessage(messageId, reactionEmoji); // Add the reaction to the message
        }
    }



    if (event.target.classList.contains('added-reactions')) {
        const messageId = event.target.dataset.messageId;
        const reactionEmoji = event.target.dataset.reactionEmoji;



        try {
            // Get the message document reference
            const messageDocRef = doc(db, `chats/${chatId}/messages/${messageId}`);
            const messageDoc = await getDoc(messageDocRef);

            // Filter out the user's own reaction
            const updatedReactions = messageDoc.data().reactions.filter(reaction => reaction.userId !== userId || reaction.emoji !== reactionEmoji);

            // Update the reactions array in Firestore
            await updateDoc(messageDocRef, { reactions: updatedReactions });
        } catch (error) {
            console.error("Error deleting reaction:", error);
        }
    }

    if (event.target.classList.contains('delete-msg')) {
        const messageId = event.target.dataset.messageId;

        try {
            // Get the reference to the message document
            const messageDocRef = doc(db, `chats/${chatId}/messages/${messageId}`);
            const message = await getDoc(messageDocRef);
            console.log({ message: message.data() })
            // Delete the message document from Firestore
            if (message.data().sender === userId)
                await deleteDoc(messageDocRef);
            else
                console.log('Cannot delete this message')

        } catch (error) {
            console.error("Error deleting message:", error);
        }
    }
});

async function loadChatMessages() {
    const chatMessagesList = document.getElementById("chat-messages-list"); // The chat conversation list
    const currentUserId = localStorage.getItem("userId");
    const recipientId = localStorage.getItem("chat");

    if (recipientId && currentUserId) {
        // Determine the chat document ID
        const chatId = (recipientId > currentUserId)
            ? `${recipientId}+${currentUserId}`
            : `${currentUserId}+${recipientId}`;

        // Query the 'messages' sub-collection, ordered by timestamp
        const currentUserDocRef = doc(db, "users", currentUserId); // Reference to the Firestore document
        const recipientUserDocRef = doc(db, "users", recipientId); // Reference to the Firestore document
        const currentUserDoc = await getDoc(currentUserDocRef); // Fetch the user data
        const recipientUserDoc = await getDoc(recipientUserDocRef); // Fetch the user data
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
                const validDate = formatDate(message.timestamp);
                if (message.type === 'files')
                    console.log('filessss ====>', message)
                const messageContent = `
                    <div class="conversation-list">
                        ${!isSentByCurrentUser ? `<div class="chat-avatar">
                            <img src="${recipientUserDoc.data()?.profileImageUrl || 'assets/images/users/user-dummy-img.jpg'}" alt="" class="rounded-circle">
                        </div>` : ""}
                        <div class="user-chat-content">
                            <div class="ctext-wrap">
                                <div class="ctext-wrap-content">
                                    ${message.type === 'files' ? `
                                    <div>
                                    ${message.files.map(item => {
                    return `
                                        <div class="p-3 border rounded-3">
                                            <div class="d-flex align-items-center attached-file">
                                                <div class="flex-shrink-0 avatar-sm me-3 ms-0 attached-file-avatar">
                                                    <div class="avatar-title bg-soft-light rounded-circle fs-20">
                                                        <i class="ri-attachment-2"></i>
                                                    </div>
                                                </div>
                                                <div class="flex-grow-1 overflow-hidden">
                                                    <div class="text-start">
                                                        <h5 class="fs-14 text-white mb-1">
                                                            ${item.fileName}</h5>
                                                        <p class="text-white-50 text-truncate fs-13 mb-0">${item.fileSize}</p>
                                                    </div>
                                                </div>
                                                <div class="flex-shrink-0 ms-4">
                                                    <div class="d-flex gap-2 fs-20 d-flex align-items-start">
                                                        <div> <a href="${item.fileUrl}" download class="text-white-50"> <i class="bx bxs-download"></i> </a> </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        `
                })}
                                    </div>
                                    ` : ''}
                                    ${message.type === 'audio' ? `<audio src="${message.audioUrl}" controls/>` : ''}
                                    ${message.type === 'audios' ?

                        message.audios.map(item => {
                            console.log('audios ===> ', message.audios.length)
                            return `
                                            <audio src="${item.fileUrl}" controls/>
                                            `
                        })

                        : ''}
                                    ${message.type !== 'audio' || message.type !== 'files' ? `<span class="ctext-content">${message?.text || ''}</span>` : ''}
                                    ${message.type === 'images' ? `
                                    <div class="message-img mb-0">
                                        ${message.images.map(item => {
                            return `
                                            <div class="message-img-list">
                                                <div> <a class="popup-img d-inline-block" href="${item.fileUrl}"> <img
                                                            src="${item.fileUrl}" alt="" class="rounded border img-thumbnail"> </a> </div>
                                                <div class="message-img-link">
                                                    <ul class="list-inline mb-0">
                                                        <li class="list-inline-item dropdown"> <a class="dropdown-toggle" href="#" role="button"
                                                                data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> <i
                                                                    class="bx bx-dots-horizontal-rounded"></i> </a>
                                                            <div class="dropdown-menu"> <a
                                                                    class="dropdown-item d-flex align-items-center justify-content-between"
                                                                    href="${item.fileUrl}" download="">Download <i
                                                                        class="bx bx-download ms-2 text-muted"></i></a> <a
                                                                    class="dropdown-item d-flex align-items-center justify-content-between" href="#"
                                                                    data-bs-toggle="collapse" data-bs-target=".replyCollapse">Reply <i
                                                                        class="bx bx-share ms-2 text-muted"></i></a> <a
                                                                    class="dropdown-item d-flex align-items-center justify-content-between" href="#"
                                                                    data-bs-toggle="modal" data-bs-target=".forwardModal">Forward <i
                                                                        class="bx bx-share-alt ms-2 text-muted"></i></a> <a
                                                                    class="dropdown-item d-flex align-items-center justify-content-between" href="#">Bookmark <i
                                                                        class="bx bx-bookmarks text-muted ms-2"></i></a> <a
                                                                    class="dropdown-item d-flex align-items-center justify-content-between delete-image"
                                                                    href="#">Delete <i class="bx bx-trash ms-2 text-muted"></i></a> </div>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            `;
                        })}
                                    </div>
                                    ` : ''}

                                </div>
                                    ${message?.reactions?.length ? `
                                    <div class="emoji-icon">
                                            ${message?.reactions?.map(item => {
                            console.log({ item, message, id: doc.id })
                            return `
                                                <a class="dropdown-toggle added-reactions" href="javascript:void;" data-user-id="${item.userId}"  data-reaction-emoji="${item.emoji}"  data-message-id="${doc.id}">${item.emoji}</a>
                                                `
                        })}
                                    </div>
                                ` : ''}
                                <div class="align-self-start message-box-drop d-flex">
                                    <div class="dropdown"> <a class="dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown"
                                            aria-haspopup="true" aria-expanded="false"> <i class="ri-emotion-happy-line"></i>
                                        </a>
                                        <div class="dropdown-menu emoji-dropdown-menu">
                                            <div class="hstack align-items-center gap-2 px-2 fs-25">
                                                    <a href="javascript:void(0);" data-id="${doc.id}">💛</a>
                                                    <a href="javascript:void(0);" data-id="${doc.id}">🤣</a>
                                                    <a href="javascript:void(0);" data-id="${doc.id}">😜</a>
                                                    <a href="javascript:void(0);" data-id="${doc.id}">😘</a>
                                                    <a href="javascript:void(0);" data-id="${doc.id}">😍</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="dropdown"> <a class="dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown"
                                            aria-haspopup="true" aria-expanded="false"> <i class="ri-more-2-fill"></i> </a>
                                        <div class="dropdown-menu">
                                                <a
                                                class="dropdown-item d-flex align-items-center justify-content-between" href="#"
                                                data-bs-toggle="modal" data-bs-target=".forwardModal">Forward <i
                                                    class="bx bx-share-alt ms-2 text-muted"></i></a>
                                                    ${message.sender !== localStorage.getItem('chat') ? `
                                                    <a
                                                class="dropdown-item d-flex align-items-center justify-content-between delete-item delete-msg"
                                                data-message-id="${doc.id}"
                                                href="#">Delete <i class="bx bx-trash text-muted ms-2"></i></a> 
                                                    ` : ''}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="conversation-name">
                                <span class="chat-time">${validDate}</span>
                            </div>
                        </div>
                        ${isSentByCurrentUser ? `<div class="chat-avatar">
                            <img src="${currentUserDoc.data()?.profileImageUrl || 'assets/images/users/user-dummy-img.jpg'}" alt="" class="rounded-circle">
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

// Function to retrieve chats for the current user
export async function getChatsForUser() {
    const userList = document.getElementById("favourite-users");

    // Clear the list before inserting new items
    userList.innerHTML = "";
    // Query the "chats" collection to get all chats where the logged-in user is a participant
    const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUserId),
        orderBy("lastMessage.timestamp", "desc") // Order by the last message timestamp
    );

    const chatDocs = await getDocs(chatsQuery);


    for (const chatDoc of chatDocs.docs) {
        const chatData = chatDoc.data();

        const userItem = document.createElement("li");
        const currentUserId = localStorage.getItem('userId');

        // Determine the other participant (recipient)
        const recipientId = chatData.participants.find((id) => id !== currentUserId);

        // Retrieve the recipient's user information
        const userRef = collection(db, "users");
        const recipientDoc = await getDoc(doc(userRef, recipientId));

        let recipientProfilePic = "";
        if (recipientDoc.exists()) {
            recipientProfilePic = recipientDoc.data().profileImageUrl || "assets/images/users/user-dummy-img.jpg";
        }


        userItem.innerHTML = `
        <a href="#"  data-id="${recipientId}">
            <span class="chat-user-img offline" data-id="${recipientId}">
                <img src="${recipientProfilePic}" class="rounded-circle avatar-xs" alt="">
                <span class="user-status"></span>
            </span>
            <span class="chat-username">${recipientDoc.data()?.username || 'Unknown User'}</span>
            <span class="chat-user-message">${chatData.lastMessage.text}</span>
        </a>`;

        userList.appendChild(userItem);

    }

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
getChatsForUser();


// Function to search chats by recipient username
async function searchChatsByUsername(username) {
    const userList = document.getElementById("favourite-users");

    // Query the "chats" collection to get all chats where the logged-in user is a participant
    const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUserId),
        orderBy("lastMessage.timestamp", "desc") // Order by the last message timestamp
    );

    const chatDocs = await getDocs(chatsQuery);

    for (const chatDoc of chatDocs.docs) {
        const chatData = chatDoc.data();

        const recipientId = chatData.participants.find((id) => id !== currentUserId);

        // Retrieve the recipient's user information
        const userRef = collection(db, "users");
        const recipientDoc = await getDoc(doc(userRef, recipientId));

        // Check if recipient username matches the search query
        if (recipientDoc.exists() && recipientDoc.data()?.username.toLowerCase().includes(username.toLowerCase())) {
            userList.innerHTML = "";
            const userItem = document.createElement("li");

            userItem.innerHTML = `
                <a href="#"  data-id="${recipientId}">
                    <span class="chat-user-img offline" data-id="${recipientId}">
                        <img src="${recipientDoc.data().profileImageUrl || 'assets/images/users/user-dummy-img.jpg'}" class="rounded-circle avatar-xs" alt="">
                        <span class="user-status"></span>
                    </span>
                    <span class="chat-username">${recipientDoc.data().username}</span>
                    <span class="chat-user-message">${chatData.lastMessage.text}</span>
                </a>`;

            userList.appendChild(userItem);
        }

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




}

// Example usage
const searchInput = document.getElementById("searchChatUser");
searchInput.addEventListener("input", function (event) {
    const searchValue = event.target.value.trim(); // Get the trimmed search value
    if (searchValue) {
        searchChatsByUsername(searchValue); // Search chats by username
    } else {
        getChatsForUser(); // If search value is empty, retrieve all chats
    }
});
