/* eslint-disable import/extensions */
import { IMicroGraphQLCache, gql, frag } from '@micro-graphql/core';
import { createCache } from '../src';

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

describe('smart-cache', () => {
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

	it('can set key and retrieve value without id', () => {
		const data = { film: { __typename: 'Film', title: 'abc' } };

		const q = cache.prepareQuery!(gql`
			query TestQuery($id: ID) {
				film(filmID: $id) {
					${fragment}
				}
			}
		`);

		cache.trySet(q, variables, data);
		const cached = cache.tryGet(q, variables);
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(true);
		expect(cached.data).toEqual(data);
	});

	it('can set key and retrieve value', () => {
		const data = { film: { __typename: 'Film', id: 'abc', title: 'abc' } };

		const q = cache.prepareQuery!(query);

		cache.trySet(q, variables, data);
		const cached = cache.tryGet(q, variables);
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(true);
		expect(cached.data).toEqual(data);
	});

	it('can set key and retrieve subset', () => {
		const data = { film: { __typename: 'Film', id: 'abc', title: 'abc' } };

		const q = cache.prepareQuery!(query);

		cache.trySet(q, variables, data);

		const q2 = cache.prepareQuery!(gql`
			query TestQuery2($id: ID) {
				film(filmID: $id) {
					__typename
					id
				}
			}
		`);

		const cached = cache.tryGet(q2, variables);
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(true);
	});

	it('can stringify and restore', () => {
		const data = { film: { __typename: 'Film', id: 'abc', title: 'abc' } };

		const q = cache.prepareQuery!(query);

		cache.trySet(q, variables, data);
		const stringified = cache.stringify();

		const newCache = createCache();
		newCache.restore(stringified);

		const cached = cache.tryGet(q, variables);
		expect(cached).toBeTruthy();
		expect(cached.success).toBe(true);
		expect(cached.data).toEqual(data);

		const restoredCached = cache.tryGet(q, variables);
		expect(restoredCached).toBeTruthy();
		expect(restoredCached.success).toBe(true);
		expect(restoredCached.data).toEqual(data);
	});
});
