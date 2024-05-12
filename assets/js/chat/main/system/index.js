import { signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { auth } from "../../config.js";

export function setDarkModeAccordingToSystemPreference() {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentMode = document.body.getAttribute("data-layout-mode");

    if (currentMode !== null) return

    if (prefersDarkMode)
        document.body.setAttribute("data-layout-mode", "dark");
    else
        document.body.setAttribute("data-layout-mode", "light");

}


export async function logout(e) {
    e.preventDefault()
    localStorage.setItem('userId', '')
    try {
        await signOut(auth)
    } catch (error) {
        console.error(error)
    }
}