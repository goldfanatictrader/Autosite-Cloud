import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString('base64url');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('base64url');
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedValue: string): boolean => {
  const [salt, encodedHash] = storedValue.split(':');
  if (salt === undefined || encodedHash === undefined) {
    return false;
  }

  const expectedHash = Buffer.from(encodedHash, 'base64url');
  const actualHash = scryptSync(password, salt, KEY_LENGTH);

  return (
    expectedHash.length === actualHash.length &&
    timingSafeEqual(expectedHash, actualHash)
  );
};
