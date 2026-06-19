import { Resend } from "resend"

const logger = {
    info: (...args: any[]) => console.log("[sendMagicLinkEmail]", ...args),
    error: (...args: any[]) => console.error("[sendMagicLinkEmail]", ...args),
}

const resend = new Resend(process.env.EMAIL_API_KEY)
const from = process.env.EMAIL_DOMAIN_ORIGIN

export const sendMagicLinkEmail = async (to: string, magicLink: string): Promise<void> => {
    if (!from) {
        logger.error("EMAIL_DOMAIN_ORIGIN is not set. This is required for sending emails.")
        return
    }

    const { data, error } = await resend.emails.send({
        from,
        to,
        subject: "Magic link for Jo Flo - painter, ceramicist",
        html: `<p><a href="${magicLink}" target="_blank">Here</a> is your magic link my darling. Click it to go to your image upload admin page.</p>`,
        text: `Here is your magic link my darling. Click it to go to your image upload admin page. ${magicLink}`,
    })

    if (error) {
        logger.error(`error sending email to ${to}:`, error)
        throw new Error("Resend API error")
    }

    logger.info(`Magic link for ${to} succeeded with id ${data?.id}`)
}
