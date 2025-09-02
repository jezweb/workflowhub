/**
 * Email verification utilities
 */

/**
 * Generate a secure verification token
 */
export async function generateVerificationToken(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate verification token expiration (24 hours from now)
 */
export function getVerificationExpiry(): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry.toISOString();
}

/**
 * Check if a verification token has expired
 */
export function isTokenExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

/**
 * Send verification email via n8n webhook
 */
export async function sendVerificationEmail(
  webhookUrl: string,
  email: string,
  username: string,
  token: string,
  appUrl: string
): Promise<boolean> {
  try {
    const verificationLink = `${appUrl}/verify-email?token=${token}`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        username,
        verificationLink,
        subject: 'Verify your WorkflowHub account',
        appName: 'WorkflowHub',
        expiryHours: 24
      }),
    });

    if (!response.ok) {
      console.error('Failed to send verification email:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

/**
 * Check if enough time has passed to allow resending verification email (5 minutes)
 */
export function canResendVerification(lastSentAt: string | null): boolean {
  if (!lastSentAt) return true;
  
  const fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
  
  return new Date(lastSentAt) < fiveMinutesAgo;
}