export function debugLog(debug: boolean, message: string, ...args: unknown[]): void {
    if (debug) {
        console.debug(message, ...args)
    }
}
