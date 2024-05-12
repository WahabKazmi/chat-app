export const redirection = (path) => {
    if (!window.location.href.includes('github')) {
        window.location.replace('/'+path)
    } else {
        window.location.replace('/chat-app/'+path)
    }
}