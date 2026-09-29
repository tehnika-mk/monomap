import { describe, expect, it } from 'vitest';
import { displayName, fullName, initials } from '$lib/utils/name';

describe('name utils', () => {
	it('joins first and last name, trimming blanks', () => {
		expect(fullName('Ada', 'Lovelace')).toBe('Ada Lovelace');
		expect(fullName('Ada', null)).toBe('Ada');
		expect(fullName('  Ada  ', '  Lovelace ')).toBe('Ada Lovelace');
	});

	it('prefers the full name and falls back to the email local-part', () => {
		expect(
			displayName({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' })
		).toBe('Ada Lovelace');
		expect(displayName({ firstName: '', lastName: '', email: 'ada@example.com' })).toBe('ada');
		expect(displayName(null)).toBe('Account');
	});

	it('builds initials from the name, then the email', () => {
		expect(initials({ firstName: 'Ada', lastName: 'Lovelace' })).toBe('AL');
		expect(initials({ firstName: 'Ada', lastName: null })).toBe('A');
		expect(initials({ email: 'ada@example.com' })).toBe('A');
		expect(initials(null)).toBe('?');
	});
});
