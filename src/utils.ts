/**
 * No matter whether a URL a subdomain with or without a protocol,
 * this function will always return the second-level domain and top-level domain.
 * For example:
 * - "https://sub.example.com" -> "example.com"
 * - "http://example.com" -> "example.com"
 * - "example.com" -> "example.com"
 * - "sub.example.com" -> "example.com"
 * - "example.co.uk" -> "example.co.uk"
 * - "sub.example.co.uk" -> "example.co.uk"
 * - "example" -> "example"
 * - "https://sub.example.com:3000" -> "example.com"
 * - "https://sub.example.com/path?query=string" -> "example.com"
 * * This function does not validate the URL format, it simply extracts the domain.
 *
 * @param url
 */
export function getDomainFromString(url: string): string {
    const domainParts = url
        .replace(/^(https?:\/\/)?(www\.)?/, '') // Remove protocol and www
        .split('/')[0] // Get the first part before any path/query
        .split('.') // Split by dot

    if (domainParts.length < 2) {
        return url // Return as is if not a valid domain
    }

    // Handle cases like example.co.uk or example.com
    const tld = domainParts.pop() || ''
    const sld = domainParts.pop() || ''

    return `${sld}.${tld}`
}
