import { deleteDoc, collection, query, where, orderBy, getDocs, getDoc, doc, onSnapshot, Timestamp, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { ref as rlRef, onDisconnect, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { formatDate } from "./../../utils.js";
import { db, database } from "../../config.js";
import { listenToPresence } from "../presense/index.js";

export async function loadChatMessages() {
    const chatMessagesList = document.getElementById("chat-messages-list");
    const currentUserId = localStorage.getItem("userId");
    const recipientId = localStorage.getItem("chat");

    if (recipientId && currentUserId) {
        const chatId = (recipientId > currentUserId)
            ? `${recipientId}+${currentUserId}`
            : `${currentUserId}+${recipientId}`;
        
        const currentUserDocRef = doc(db, "users", currentUserId);
        const recipientUserDocRef = doc(db, "users", recipientId);
        const currentUserDoc = await getDoc(currentUserDocRef);
        const recipientUserDoc = await getDoc(recipientUserDocRef);

        const messagesCollectionRef = collection(db, `chats/${chatId}/messages`);
        const messagesQuery = query(messagesCollectionRef, orderBy("timestamp"));

        onSnapshot(messagesQuery, (snapshot) => {
            chatMessagesList.innerHTML = "";
            snapshot.forEach(async (doc) => {
                const message = doc.data();
                const isSentByCurrentUser = message.sender === currentUserId;

                const messageItem = document.createElement("li");
                messageItem.className = `chat-list ${isSentByCurrentUser ? "right" : "left"}`;
                const validDate = formatDate(message.timestamp);
                console.log({ message })
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
                                                <a href="javascript:void(0);" data-id="${doc.id}">👍</a>
                                                <a href="javascript:void(0);" data-id="${doc.id}">❤️</a>
                                                <a href="javascript:void(0);" data-id="${doc.id}">😆</a>
                                                <a href="javascript:void(0);" data-id="${doc.id}">😮</a>
                                                <a href="javascript:void(0);" data-id="${doc.id}">😢</a>
                                                <a href="javascript:void(0);" data-id="${doc.id}">😡</a>
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
                            ${message.seen && message.sender === currentUserId ? `<span class="text-success check-message-icon"><i class="bx bx-check-double"></i></span>` : ''}
                        </div>
                    </div>
                    ${isSentByCurrentUser ? `<div class="chat-avatar">
                        <img src="${currentUserDoc.data()?.profileImageUrl || 'assets/images/users/user-dummy-img.jpg'}" alt="" class="rounded-circle">
                    </div>` : ""}
                </div>
            `;

                messageItem.innerHTML = messageContent;
                chatMessagesList.appendChild(messageItem);


                if (message.sender === recipientId) {
                    await updateDoc(doc.ref, { seen: true })
                }

            });

            // Scroll to the bottom to display the latest message
            chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
        });
    } else {
        console.error("Missing recipient ID or current user ID.");
    }
}

export async function loadChatUser() {
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

// Function to retrieve chats for the current user
export async function getChatsForUser() {
    const currentUserId = localStorage.getItem('userId');
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

    console.log('before loop', chatDocs.docs, currentUserId, userList)

    // Array to store promises for fetching user information
    const userPromises = [];

    for (const chatDoc of chatDocs.docs) {
        const chatData = chatDoc.data();


        // Determine the other participant (recipient)
        const recipientId = chatData.participants.find((id) => id !== currentUserId);

        // Retrieve the recipient's user information (Push promise to array)
        const userRef = collection(db, "users");
        const promise = getDoc(doc(userRef, recipientId));
        userPromises.push(promise);
    }

    // Fetch user information in parallel
    const userDocs = await Promise.all(userPromises);

    console.log('after loop')

    // Iterate over chat documents and corresponding user documents
    chatDocs.docs.forEach((chatDoc, index) => {
        const chatData = chatDoc.data();
        const recipientDoc = userDocs[index];
        const recipientId = chatData.participants.find((id) => id !== currentUserId);

        const userItem = document.createElement("li");

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
    });

    document.querySelectorAll('.chat-user-list a').forEach(item => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            localStorage.setItem('chat', item.getAttribute('data-id'))
            loadChatUser();
            loadChatMessages();
            document.querySelector('.user-chat').classList.add('user-chat-show');
        })
    })
    
    listenToPresence()
}
