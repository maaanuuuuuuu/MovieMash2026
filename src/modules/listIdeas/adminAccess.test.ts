import { describe, expect, it } from 'vitest';
import { isAdminEmail, isAdminSession } from './adminAccess';

describe('adminAccess', () => {
  it('matches the allowlisted admin email without case sensitivity', () => {
    expect(isAdminEmail('Desir.Emmanuel@gmail.com')).toBe(true);
    expect(isAdminEmail('other@example.com')).toBe(false);
  });

  it('accepts only signed-in sessions with the allowlisted email', () => {
    expect(
      isAdminSession({
        status: 'signedIn',
        user: {
          uid: 'admin',
          displayName: 'Admin',
          email: 'desir.emmanuel@gmail.com',
          photoURL: null,
        },
      }),
    ).toBe(true);

    expect(isAdminSession({ status: 'signedOut' })).toBe(false);
  });
});
