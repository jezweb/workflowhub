// Password hashing using Web Crypto API (Workers-compatible)

const encoder = new TextEncoder();

async function generateSalt(): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...salt));
}

async function pbkdf2(password: string, salt: string, iterations: number): Promise<string> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const saltBuffer = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    256
  );

  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt();
  const iterations = 10000;
  const hash = await pbkdf2(password, salt, iterations);
  
  // Store salt, iterations, and hash together
  return `${salt}:${iterations}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, iterations, hash] = storedHash.split(':');
  const computedHash = await pbkdf2(password, salt, parseInt(iterations));
  return computedHash === hash;
}