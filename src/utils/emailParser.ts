export const parseEmail = (request: Record<string, unknown>) => {
    const email = request?.email
    if (!email) return { type: "error", message: "Email is required" }

    return { type: "success", payload: email }
}
