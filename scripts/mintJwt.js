import { SignJWT } from "jose"
const secret = new TextEncoder().encode(process.env.JO_CERAMIC_PAINTER_JWT_SECRET)
const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("contact@coriirdaia.resend.app")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret)
console.log(token)
