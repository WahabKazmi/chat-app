export const redirection = (path) => {
    if (window.location.href.includes('localhost')) {
        window.location.replace('/dist/'+path)
    } else {
        window.location.replace('/'+path)
    }
}