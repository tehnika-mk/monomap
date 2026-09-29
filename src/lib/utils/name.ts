export interface NameParts {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
}

function clean(value: string | null | undefined): string {
	return (value ?? '').trim();
}

export function fullName(first?: string | null, last?: string | null): string {
	return [clean(first), clean(last)].filter(Boolean).join(' ');
}

// The name to show in the sidebar: "First Last", else the email local-part,
// else a neutral fallback.
export function displayName(user: NameParts | null | undefined): string {
	if (!user) return 'Account';
	const name = fullName(user.firstName, user.lastName);
	if (name) return name;
	const local = clean(user.email).split('@')[0];
	return local || 'Account';
}

export function initials(user: NameParts | null | undefined): string {
	if (!user) return '?';
	const name = fullName(user.firstName, user.lastName);
	if (name) {
		const parts = name.split(/\s+/);
		const first = parts[0]?.[0] ?? '';
		const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
		const result = (first + second).toUpperCase();
		if (result) return result;
	}
	return (clean(user.email)[0] ?? '?').toUpperCase();
}
