import { collection, query, where, orderBy, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { db } from "../../config.js";
import { listenToPresence } from "../presense/index.js";
import { loadChatMessages, loadChatUser } from "./../messages/index.js";

export async function searchChatsByUsername(username) {
    const userList = document.getElementById("favourite-users");
    const currentUserId = localStorage.getItem('userId');

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

                document.querySelector('.user-chat').classList.add('user-chat-show');
                // user-chat-show
            })
        })
        listenToPresence()

    }

}