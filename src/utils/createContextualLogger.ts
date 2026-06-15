export const createContextualLogger = (context: string) => ({
    info: (...args: any[]) => console.log(`[${context}]`, ...args),
    error: (...args: any[]) => console.error(`[${context}]`, ...args),
    warn: (...args: any[]) => console.warn(`[${context}]`, ...args),
})
