import { Timestamp, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";
import { db, storage } from "./config.js";


const truncateText = (text = '', maxLength = 30) => {
    if (text?.length <= maxLength) {
        return text; // No need to truncate
    }

    // Find the last space before the maximum length
    const lastSpaceIndex = text.lastIndexOf(" ", maxLength - 1);

    // If there's no space or it's too early, just truncate
    if (lastSpaceIndex === -1 || lastSpaceIndex < maxLength / 2) {
        return text.substring(0, maxLength - 3) + "...";
    }

    // Truncate at the last space and add ellipsis
    return text.substring(0, lastSpaceIndex) + "...";
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


// Function to fetch user data from Firestore
async function fetchUserData(userId) {
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) 
        return userSnapshot.data();
    else return null;
}
export { truncateText, formatDate, uploadFile, fetchUserData }