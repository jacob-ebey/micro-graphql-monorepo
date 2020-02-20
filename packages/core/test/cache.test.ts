/* eslint-disable import/extensions */
import {
	createCache,
	IMicroGraphQLCache,
	gql,
	frag
} from '../src';

const fragment = frag`
	fragment TestFrag on Film {
		title
	}
`;

const query = gql`
	query TestQuery($id: ID) {
		film(filmID: $id) {
			id
			${fragment}
		}
	}
`;

const variables = { id: 'abc' };

describe('cache', () => {
	let cache: IMicroGraphQLCache;

	beforeEach(() => {
		cache = createCache();
	});

	it('returns success as false and undefined data for unset key', () => {
		const cached = cache.tryGet(query, variables);
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(false);
		expect(cached.data).toBeUndefined();
	});

	it('can set key and retrieve value', () => {
		const data = { v: 10 };

		cache.trySet(query, variables, data);
		const cached = cache.tryGet(query, variables);
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(true);
		expect(cached.data).toBe(data);
	});

	it('can stringify and restore', () => {
		const data = { v: 10 };

		cache.trySet(query, variables, data);
		const stringified = cache.stringify();

		const newCache = createCache();
		newCache.restore(stringified);

		const cached = cache.tryGet(query, variables);
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(true);
		expect(cached.data).toBe(data);

		const restoredCached = cache.tryGet(query, variables);
		expect(restoredCached).toBeTruthy();
		expect(restoredCached.success).toBe(true);
		expect(restoredCached.data).toEqual(data);
	});
});
