// eslint-disable-next-line import/no-extraneous-dependencies
import gql from 'graphql-tag';

import { createCache, IMicroGraphQLCache } from '../src/cache';

const fragment = gql`
	fragment TestFrag on Film {
		releaseDate
	}
`;

const query = gql`
	query TestQuery($id: ID) {
		film(filmID: $id) {
			id
			...TestFrag
			... on Film {
        title
    	}
		}
	}
	${fragment}
`;

const subQuery = gql`
	query TestSubQuery($id: ID) {
		film(filmID: $id) {
			id
			title
		}
	}
`;

interface IVariables {
	id: string;
}

const variables = { id: 'abc' };

interface IExpected {
	film: {
		__typename: 'Film';
		id: string;
		title: string;
		releaseDate: string;
	};
}

const expected: IExpected = {
	film: {
		__typename: 'Film',
		id: 'abc',
		title: 'abc',
		releaseDate: '2020-01-30'
	}
};

const changed: IExpected = {
	film: {
		__typename: 'Film',
		id: 'abc',
		title: 'def',
		releaseDate: '2020-02-30'
	}
};

interface ISubExpected {
	film: {
		__typename: 'Film';
		id: string;
		title: string;
	};
}

const subExpected: ISubExpected = {
	film: {
		__typename: 'Film',
		id: 'abc',
		title: 'abc'
	}
};

const subChanged: ISubExpected = {
	film: {
		__typename: 'Film',
		id: 'abc',
		title: 'def'
	}
};

describe('smart-cache', () => {
	let cache: IMicroGraphQLCache;

	beforeEach(() => {
		cache = createCache();
	});

	it('skips initial callback if nothing in cache', () => {
		let called = 0;

		const unsubscribe = cache.subscribe<IExpected, IVariables>(
			cache.prepareQuery(query),
			variables,
			() => {
				called += 1;
			}
		);

		unsubscribe();

		expect(called).toBe(0);
	});

	it('can write and read query', () => {
		cache.writeQuery(cache.prepareQuery(query), variables, expected);
		const data = cache.readQuery<IExpected, IVariables>(query, variables);
		expect(data).toEqual(expected);
	});

	it('can stringify and restore', () => {
		cache.writeQuery(cache.prepareQuery(query), variables, expected);
		const data = cache.readQuery<IExpected, IVariables>(query, variables);
		expect(data).toEqual(expected);

		const secondCache = createCache();
		secondCache.restore(cache.stringify());
		const data2 = cache.readQuery<IExpected, IVariables>(cache.prepareQuery(query), variables);
		expect(data2).toEqual(expected);
	});

	it('can restore default', () => {
		const secondCache = createCache();
		secondCache.restore('""');
		const data2 = cache.readQuery<IExpected, IVariables>(cache.prepareQuery(query), variables);
		expect(data2).toBeUndefined();
	});

	it('can subscribe and get initial value', () => {
		cache.writeQuery<IExpected, IVariables>(cache.prepareQuery(query), variables, expected);

		let called = 0;
		let result: IExpected | undefined;

		const unsubscribe = cache.subscribe<IExpected, IVariables>(
			query,
			variables,
			(data: IExpected) => {
				called += 1;
				result = data;
			}
		);

		unsubscribe();

		expect(called).toBe(1);
		expect(result).toEqual(expected);
	});

	it('skips callback if query not fulfilled', () => {
		const unrelatedQuery = gql`
			query TestNoFulfilledQuery {
				rofl {
					name
				}
			}
		`;

		let called = 0;

		const unsubscribe = cache.subscribe<IExpected, IVariables>(
			cache.prepareQuery(unrelatedQuery),
			variables,
			() => {
				called += 1;
			}
		);

		cache.writeQuery(cache.prepareQuery(query), variables, expected);

		expect(called).toBe(0);

		unsubscribe();
	});

	it('skips callback if query not fulfilled and existing data', () => {
		const unrelatedQuery = gql`
			query TestNoFulfilledQuery {
				rofl {
					name
				}
			}
		`;

		cache.writeQuery(cache.prepareQuery(unrelatedQuery), {}, {
			rofl: {
				__typename: 'Rofl',
				name: 'rofl'
			}
		});

		let called = 0;

		const unsubscribe = cache.subscribe<IExpected, IVariables>(
			cache.prepareQuery(unrelatedQuery),
			variables,
			() => {
				called += 1;
			}
		);
		expect(called).toBe(1);

		cache.writeQuery(cache.prepareQuery(query), variables, expected);

		expect(called).toBe(1);

		unsubscribe();
	});

	it('can subscribe and get updated value', () => {
		cache.writeQuery(query, variables, expected);

		let called = 0;
		let result: IExpected | undefined;

		const unsubscribe = cache.subscribe<IExpected, IVariables>(
			cache.prepareQuery(query),
			variables,
			(data: IExpected) => {
				called += 1;
				result = data;
			}
		);

		expect(called).toBe(1);
		expect(result).toEqual(expected);

		cache.writeQuery(cache.prepareQuery(query), variables, changed);

		unsubscribe();

		expect(called).toBe(2);
		expect(result).toEqual(changed);
	});

	it('can subscribe and get updated value from sub query', () => {
		cache.writeQuery(cache.prepareQuery(query), variables, expected);

		let called = 0;
		let result: IExpected | undefined;

		const unsubscribe = cache.subscribe<IExpected, IVariables>(
			cache.prepareQuery(query),
			variables,
			(data: IExpected) => {
				called += 1;
				result = data;
			}
		);

		expect(called).toBe(1);
		expect(result).toEqual(expected);

		cache.writeQuery(cache.prepareQuery(subQuery), variables, subChanged);

		unsubscribe();

		expect(called).toBe(2);
		expect(result).toEqual({
			film: {
				...expected.film,
				...subChanged.film
			}
		});
	});
});
