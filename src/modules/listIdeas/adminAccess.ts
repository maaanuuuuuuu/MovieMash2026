import type { AuthSession, AuthUser } from '../auth/authRepository';

const adminEmails = new Set(['desir.emmanuel@gmail.com']);

export function isAdminEmail(email: string | null | undefined) {
  return typeof email === 'string' && adminEmails.has(email.trim().toLowerCase());
}

export function isAdminUser(user: Pick<AuthUser, 'email'> | undefined) {
  return isAdminEmail(user?.email);
}

export function isAdminSession(session: AuthSession) {
  return session.status === 'signedIn' && isAdminUser(session.user);
}
