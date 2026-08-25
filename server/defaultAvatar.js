import { randomInt } from 'crypto';

export const DEFAULT_AVATARS = Array.from(
  { length: 9 },
  (_, index) => `/avatars/defaults/avatar-${String(index + 1).padStart(2, '0')}.jpg`
);

export function generateDefaultAvatar() {
  return DEFAULT_AVATARS[randomInt(DEFAULT_AVATARS.length)];
}
