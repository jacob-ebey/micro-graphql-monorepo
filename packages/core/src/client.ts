/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/extensions */

import { IMicroGraphQLCache } from './cache';
import { objectHash } from './hash';

export interface IMicroGraphQLConfig {
	cache: IMicroGraphQLCache;
	url: string;
	ssr?: boolean;
	fetch(input: RequestInfo, init?: RequestInit | undefined): Promise<Response>;
}

export interface IMicroGraphQLError {
	message: string;
	path?: ReadonlyArray<string | number>;
	extensions?: { [key: string]: unknown };
}

export interface IMicroGraphQLResult<TData> {
	loading: boolean;
	data?: TData;
	errors?: IMicroGraphQLError[];
}

export interface IMicroGraphQLQueryOptions<TQueryVariables extends { [key: string]: unknown }> {
	skipCache?: boolean;
	variables?: TQueryVariables;
}

export interface IMicroGraphQLSubscriptionOptions<
	TQueryVariables extends { [key: string]: unknown }
>
	extends IMicroGraphQLQueryOptions<TQueryVariables> {
	query: string;
}

export interface IMicroGraphQLClient {
	cache?: IMicroGraphQLCache;
	ssr?: boolean;
	// eslint-disable-next-line max-len
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	query<TData extends { [key: string]: any }, TQueryVariables extends { [key: string]: any }>(
		query: string,
		options?: IMicroGraphQLQueryOptions<TQueryVariables>
	): Promise<IMicroGraphQLResult<TData>>;
	// eslint-disable-next-line max-len
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	subscribe: <TData extends { [key: string]: any }, TQueryVariables extends { [key: string]: any }>(
		options: IMicroGraphQLSubscriptionOptions<TQueryVariables>,
		subscription: (data: IMicroGraphQLResult<TData>) => void
	) => () => void;
	resolveQueries(): Promise<void>;
}

export class MicroGraphQLKeyError extends Error {}

export const queryKeyError = 'error creating a unique key for the query';

export function createClient({
	url,
	cache,
	ssr,
	fetch
}: IMicroGraphQLConfig): IMicroGraphQLClient {
	const subscriptions = new Map<string, Array<(data: IMicroGraphQLResult<any> & {}) => void>>();

	const queries: { [key: string]: Promise<IMicroGraphQLResult<unknown>> } = {};

	return {
		cache,
		ssr,
		resolveQueries: async (): Promise<void> => {
			await Promise.all(Object.getOwnPropertyNames(queries).map(key => queries[key]));
		},
		// eslint-disable-next-line max-len
		subscribe: <TData extends { [key: string]: any }, TQueryVariables extends { [key: string]: any }>(
			options: IMicroGraphQLSubscriptionOptions<TQueryVariables>,
			subscription: (data: IMicroGraphQLResult<TData>) => void
		): (() => void) => {
			const query = !options.skipCache && cache.prepareQuery
				? cache.prepareQuery(options.query)
				: options.query;

			const cached = cache.tryGet<TData>(query, options.variables);
			if (cached.success) {
				subscription({
					loading: false,
					data: cached.data
				});
			}

			const key = objectHash({ query, variables: options.variables });

			const subs = subscriptions.get(key) || [];
			subs.push(subscription);
			subscriptions.set(key, subs);

			return (): void => {
				const toRemoveFrom = subscriptions.get(key)!;
				subscriptions.set(
					key,
					toRemoveFrom.filter(s => s !== subscription)
				);
			};
		},
		// eslint-disable-next-line max-len
		query: async <TData extends { [key: string]: any }, TQueryVariables extends { [key: string]: any }>(
			inputQuery: string,
			options?: IMicroGraphQLQueryOptions<TQueryVariables>
		): Promise<IMicroGraphQLResult<TData>> => {
			const { skipCache }: IMicroGraphQLQueryOptions<TQueryVariables> = {
				skipCache: false,
				...options
			};

			const query = !skipCache && cache.prepareQuery ? cache.prepareQuery(inputQuery) : inputQuery;

			const cachedResult = !skipCache && cache.tryGet<TData>(query, options && options.variables);

			if (!skipCache && cachedResult && cachedResult.success) {
				return {
					loading: false,
					data: cachedResult.data
				};
			}

			const key = objectHash({ query, variables: options && options.variables });

			const subs = subscriptions.get(key);

			if (subs) {
				subs.forEach(sub => sub({
					loading: true
				}));
			}

			const resultPromise = (async (): Promise<IMicroGraphQLResult<TData>> => {
				const response = await fetch(url, {
					method: 'post',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						query,
						variables: options && options.variables
					})
				});

				const json = (await response.json()) as IMicroGraphQLResult<TData>;

				if (json.data) {
					cache.trySet<TData>(query, options && options.variables, json.data);
				}

				return {
					errors: undefined,
					...json,
					loading: false
				};
			})();

			if (ssr) {
				queries[key] = resultPromise;
			}

			const result = await resultPromise;

			if (subs) {
				subs.forEach(sub => sub(result));
			}

			return result;
		}
	};
}
