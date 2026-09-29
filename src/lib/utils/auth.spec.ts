import { describe, expect, it } from 'vitest';
import { isAlreadyRegisteredError, isExistingAccount } from './auth';

describe('isExistingAccount', () => {
	it('detects an existing email (empty identities)', () => {
		expect(isExistingAccount({ identities: [] })).toBe(true);
	});

	it('treats a fresh signup (with identities) as new', () => {
		expect(isExistingAccount({ identities: [{ id: 'x' }] })).toBe(false);
	});

	it('is false for a missing user or identities', () => {
		expect(isExistingAccount(null)).toBe(false);
		expect(isExistingAccount(undefined)).toBe(false);
		expect(isExistingAccount({})).toBe(false);
	});
});

describe('isAlreadyRegisteredError', () => {
	it('matches common Supabase messages', () => {
		expect(isAlreadyRegisteredError('User already registered')).toBe(true);
		expect(isAlreadyRegisteredError('An account already exists')).toBe(true);
		expect(isAlreadyRegisteredError('Invalid login credentials')).toBe(false);
		expect(isAlreadyRegisteredError(null)).toBe(false);
	});
});
