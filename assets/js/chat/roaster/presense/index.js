import { ref as rlRef, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { database } from "../../config.js";


export function listenToPresence() {
    
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