// Mock email client. Swap sendMagicLinkEmail's body for a real transactional
// provider (Resend/Postmark/etc.) later — the signature stays the same.
// Lives under netlify/ (not src/) so client-side code can never import it,
// and so the eventual real provider's API key never leaks into the bundle.

export const sendMagicLinkEmail = async (to: string, magicLink: string): Promise<void> => {
    console.log(`\n[mock email] magic link for ${to}:\n${magicLink}\n`)
}
