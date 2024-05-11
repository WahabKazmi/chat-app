export const redirection = (path) => {
    if (!window.location.href.includes('netlify')) {
        window.location.replace('/dist/'+path)
    } else {
        window.location.replace('/'+path)
    }
}