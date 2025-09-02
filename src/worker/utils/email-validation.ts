/**
 * Email domain validation utilities
 */

/**
 * Check if an email domain is allowed based on configuration
 * @param email - The email address to check
 * @param allowedDomains - Comma-separated list of allowed domains or "*" for open registration
 * @returns true if email domain is allowed, false otherwise
 */
export function isEmailDomainAllowed(email: string, allowedDomains: string): boolean {
  // Open registration if empty or wildcard
  if (!allowedDomains || allowedDomains === '*') {
    return true;
  }

  // Extract domain from email
  const emailDomain = email.toLowerCase().split('@')[1];
  if (!emailDomain) {
    return false;
  }

  // Parse allowed domains
  const domains = allowedDomains
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(d => d.length > 0);

  // Check each allowed domain
  for (const allowedDomain of domains) {
    // Handle subdomain wildcard (*.example.com)
    if (allowedDomain.startsWith('*.')) {
      const baseDomain = allowedDomain.substring(2);
      // Check if email domain ends with the base domain
      if (emailDomain === baseDomain || emailDomain.endsWith('.' + baseDomain)) {
        return true;
      }
    }
    // Exact domain match
    else if (emailDomain === allowedDomain) {
      return true;
    }
  }

  return false;
}

/**
 * Get a user-friendly message about allowed domains
 * @param allowedDomains - Comma-separated list of allowed domains
 * @returns Human-readable message about allowed domains
 */
export function getAllowedDomainsMessage(allowedDomains: string): string {
  if (!allowedDomains || allowedDomains === '*') {
    return 'All email domains are allowed';
  }

  const domains = allowedDomains
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length > 0);

  if (domains.length === 0) {
    return 'All email domains are allowed';
  }

  if (domains.length === 1) {
    return `Registration is restricted to ${domains[0]} email addresses`;
  }

  const lastDomain = domains.pop();
  return `Registration is restricted to ${domains.join(', ')} or ${lastDomain} email addresses`;
}

/**
 * Parse and clean allowed domains configuration
 * @param allowedDomains - Raw configuration string
 * @returns Cleaned array of domains
 */
export function parseAllowedDomains(allowedDomains: string): string[] {
  if (!allowedDomains || allowedDomains === '*') {
    return [];
  }

  return allowedDomains
    .split(',')
    .map(d => d.trim().toLowerCase())
    .filter(d => d.length > 0);
}