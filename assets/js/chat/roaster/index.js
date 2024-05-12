import { deleteDoc, collection, query, where, orderBy, getDocs, getDoc, doc, onSnapshot, Timestamp, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { ref as rlRef, onDisconnect, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { database, db, auth, storage } from "./../config.js";
import { listenToPresence } from "./presense/index.js";
import { searchChatsByUsername } from "./search/index.js";
import { getChatsForUser, loadChatMessages, loadChatUser } from "./messages/index.js";
import { addReactionToMessage } from "./reactions/index.js";


// Get the currently logged-in user ID
const currentUserId = localStorage.getItem('userId'); // Replace with actual user ID


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
