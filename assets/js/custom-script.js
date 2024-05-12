export const redirection = (path) => {
    alert(window.location.href.includes('github'))
    if (!window.location.href.includes('github')) {
        window.location.replace('/'+path)
    } else {
        window.location.replace('/chat-app/'+path)
    }
}