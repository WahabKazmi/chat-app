import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { db } from "../../config.js";
import { fetchUserData } from "../../utils.js";

export const updateUserProfileSection = async (user) => {

    const defaultProfileData = {
        username: "Default Username",
        phone: "No phone number provided",
        email: "No email provided",
        location: "No location provided",
        bio: "No bio available",
        designation: "No designation available"
    };


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

}



// Function to update the user profile detail sidebar
export async function updateUserProfileSidebar(userId) {
    const userData = await fetchUserData(userId);
    if (!userData) return;
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

 // Function to update user information in Firestore
 export async function updateUserProfile(uid) {
    const updatedData = {
        username: document.querySelector("#pi-name").value.toLocaleLowerCase(),
        email: document.querySelector("#pi-email").value,
        phone: document.querySelector("#pi-phone").value,
        location: document.querySelector("#pi-location").value,
        bio: document.querySelector("#pi-bio").value,
        designation: document.querySelector("#pi-designation").value
    };
    const userDocRef = doc(db, "users", uid);

    try {
        await updateDoc(userDocRef, updatedData);
        alert("Profile updated successfully!");
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
    }
}