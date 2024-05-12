import { doc, getDoc, collection, query, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { db } from "../../config.js";
import { truncateText } from "../../utils.js";
import { loadChatMessages, loadChatUser } from "../../roaster/messages/index.js";

// Fetch users from Firestore
export async function fetchUsers() {
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