import { describe, expect, it } from 'vitest';
import { isLocalAccountKey } from './reset';

describe('isLocalAccountKey', () => {
	it('matches device markers and unscoped tombstones', () => {
		expect(isLocalAccountKey('mindmap:device-id')).toBe(true);
		expect(isLocalAccountKey('mindmap:nudge-dismissed')).toBe(true);
		expect(isLocalAccountKey('mindmap:sync-tombstones')).toBe(true);
	});

	it('matches per-account tombstone stores', () => {
		expect(isLocalAccountKey('mindmap:sync-tombstones:user-1')).toBe(true);
	});

	it('keeps UI preferences and unrelated keys', () => {
		expect(isLocalAccountKey('mindmap:theme')).toBe(false);
		expect(isLocalAccountKey('mindmap:grid')).toBe(false);
		expect(isLocalAccountKey('mindmap:snap')).toBe(false);
		expect(isLocalAccountKey('sb-abc-auth-token')).toBe(false);
	});
});
