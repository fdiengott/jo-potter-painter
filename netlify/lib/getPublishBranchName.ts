export const getPublishBranchName = () => {
    const sanitizedDateIso = new Date().toISOString().replace(/[:.]/g, "-")
    return `publish-artworks/${sanitizedDateIso}`
}
