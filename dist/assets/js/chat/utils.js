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


export {truncateText}