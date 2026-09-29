export interface SignUpUserLike {
	identities?: Array<unknown> | null;
}

// Supabase returns an existing-email signup as a user with an empty identities
// array (and no session) when email confirmation is enabled. That is the only
// client-side signal that the account already exists.
export function isExistingAccount(user: SignUpUserLike | null | undefined): boolean {
	return !!user && Array.isArray(user.identities) && user.identities.length === 0;
}

export function isAlreadyRegisteredError(message: string | null | undefined): boolean {
	if (!message) return false;
	return /already registered|already exists|user already/i.test(message);
}

export const EXISTING_ACCOUNT_MESSAGE =
	'An account with this email already exists. Try signing in instead.';
