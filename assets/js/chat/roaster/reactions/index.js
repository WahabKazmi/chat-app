import { deleteDoc, collection, query, where, orderBy, getDocs, getDoc, doc, onSnapshot, Timestamp, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { db } from "../../config.js";

export async function addReactionToMessage(messageId, reactionEmoji) {
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