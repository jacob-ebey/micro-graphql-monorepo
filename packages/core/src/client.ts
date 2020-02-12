/* eslint-disable import/extensions */

import { ITinyGraphQLCache } from './cache';
import { ObjectHasher } from './hash';

export interface ITinyGraphQLConfig {
	cache: ITinyGraphQLCache;
	url: string;
	ssr?: boolean;
	fetch(input: RequestInfo, init?: RequestInit | undefined): Promise<Response>;
	hash: ObjectHasher;
}

export interface ITinyGraphQLError {
	message: string;
	path?: ReadonlyArray<string | number>;
	extensions?: { [key: string]: unknown };
}

export interface ITinyGraphQLResult<TData> {
	loading: boolean;
	data?: TData;
	errors?: ITinyGraphQLError[];
}

export interface ITinyGraphQLQueryOptions<TQueryVariables> {
	skipCache?: boolean;
	variables?: TQueryVariables;
}

export interface ITinyGraphQLSubscriptionOptions<TQueryVariables = unknown>
	extends ITinyGraphQLQueryOptions<TQueryVariables> {
	query: string;
}

export interface ITinyGraphQLClient {
	cache?: ITinyGraphQLCache;
	hash: ObjectHasher;
	ssr?: boolean;
	query<TData, TQueryVariables>(
		query: string,
		options?: ITinyGraphQLQueryOptions<TQueryVariables>
	): Promise<ITinyGraphQLResult<TData>>;
	subscribe: <TData, TQueryVariables>(
		options: ITinyGraphQLSubscriptionOptions<TQueryVariables>,
		subscription: (data: ITinyGraphQLResult<TData>) => void
	) => () => void;
	resolveQueries(): Promise<void>;
}

export class TinyGraphQLKeyError extends Error {}

export const queryKeyError = 'error creating a unique key for the query';

export function createClient({
	url,
	cache,
	ssr,
	fetch,
	hash
}: ITinyGraphQLConfig): ITinyGraphQLClient {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const subscriptions = new Map<string, Array<(data: ITinyGraphQLResult<any> & {}) => void>>();

	const queries: { [key: string]: Promise<ITinyGraphQLResult<unknown>> } = {};

	return {
		cache,
		hash,
		ssr,
		resolveQueries: async (): Promise<void> => {
			await Promise.all(Object.getOwnPropertyNames(queries).map(key => queries[key]));
		},
		subscribe: <TData, TQueryVariables>(
			options: ITinyGraphQLSubscriptionOptions<TQueryVariables>,
			subscription: (data: ITinyGraphQLResult<TData>) => void
		): (() => void) => {
			const key = hash({ query: options.query, variables: options.variables });

			if (!key) {
				throw new TinyGraphQLKeyError(queryKeyError);
			}

			const cached = cache.tryGet<TData>(key);
			if (cached && cached.success) {
				subscription({
					loading: false,
					data: cached.data
				});
			}

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
		query: async <TData, TQueryVariables = unknown>(
			query: string,
			options?: ITinyGraphQLQueryOptions<TQueryVariables>
		): Promise<ITinyGraphQLResult<TData>> => {
			const key = hash({ query, variables: options && options.variables });

			if (!key) {
				throw new TinyGraphQLKeyError(queryKeyError);
			}

			const { skipCache }: ITinyGraphQLQueryOptions<TQueryVariables> = {
				skipCache: false,
				...options
			};

			const cachedResult = !skipCache && cache.tryGet<TData>(key);

			if (!skipCache && cachedResult && cachedResult.success) {
				return {
					loading: false,
					data: cachedResult.data
				};
			}

			const subs = subscriptions.get(key);

			if (subs) {
				subs.forEach(sub => sub({
					loading: true
				}));
			}

			const resultPromise = (async (): Promise<ITinyGraphQLResult<TData>> => {
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

				const json = (await response.json()) as ITinyGraphQLResult<TData>;

				if (json.data) {
					cache.trySet<TData>(key, json.data);
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
