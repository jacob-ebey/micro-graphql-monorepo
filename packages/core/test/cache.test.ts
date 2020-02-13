/* eslint-disable import/extensions */
import { createCache, IMicroGraphQLCache } from '../src';

describe('cache', () => {
	let cache: IMicroGraphQLCache;

	beforeEach(() => {
		cache = createCache();
	});

	it('returns success as false and undefined data for unset key', () => {
		const cached = cache.tryGet('unknown');
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(false);
		expect(cached.data).toBeUndefined();
	});

	it('can set key and retrieve value', () => {
		const data = { v: 10 };

		cache.trySet('key', data);
		const cached = cache.tryGet('key');
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(true);
		expect(cached.data).toBe(data);
	});

	it('can stringify and restore', () => {
		const data = { v: 10 };

		cache.trySet('key', data);
		const stringified = cache.stringify();

		const newCache = createCache();
		newCache.restore(stringified);

		const cached = cache.tryGet('key');
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(true);
		expect(cached.data).toBe(data);

		const restoredCached = cache.tryGet('key');
		expect(restoredCached).toBeTruthy();
		expect(restoredCached.success).toBe(true);
		expect(restoredCached.data).toEqual(data);
	});
});
