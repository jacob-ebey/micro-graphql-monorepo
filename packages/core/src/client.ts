/* eslint-disable import/extensions */

import { IMicroGraphQLCache } from './cache';
import { ObjectHasher } from './hash';

export interface IMicroGraphQLConfig {
	cache: IMicroGraphQLCache;
	url: string;
	ssr?: boolean;
	fetch(input: RequestInfo, init?: RequestInit | undefined): Promise<Response>;
	hash: ObjectHasher;
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

export interface IMicroGraphQLQueryOptions<TQueryVariables> {
	skipCache?: boolean;
	variables?: TQueryVariables;
}

export interface IMicroGraphQLSubscriptionOptions<TQueryVariables = unknown>
	extends IMicroGraphQLQueryOptions<TQueryVariables> {
	query: string;
}

export interface IMicroGraphQLClient {
	cache?: IMicroGraphQLCache;
	hash: ObjectHasher;
	ssr?: boolean;
	query<TData, TQueryVariables>(
		query: string,
		options?: IMicroGraphQLQueryOptions<TQueryVariables>
	): Promise<IMicroGraphQLResult<TData>>;
	subscribe: <TData, TQueryVariables>(
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
	fetch,
	hash
}: IMicroGraphQLConfig): IMicroGraphQLClient {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const subscriptions = new Map<string, Array<(data: IMicroGraphQLResult<any> & {}) => void>>();

	const queries: { [key: string]: Promise<IMicroGraphQLResult<unknown>> } = {};

	return {
		cache,
		hash,
		ssr,
		resolveQueries: async (): Promise<void> => {
			await Promise.all(Object.getOwnPropertyNames(queries).map(key => queries[key]));
		},
		subscribe: <TData, TQueryVariables>(
			options: IMicroGraphQLSubscriptionOptions<TQueryVariables>,
			subscription: (data: IMicroGraphQLResult<TData>) => void
		): (() => void) => {
			const key = hash({ query: options.query, variables: options.variables });

			if (!key) {
				throw new MicroGraphQLKeyError(queryKeyError);
			}

			const cached = cache.tryGet<TData>(key);
			if (cached.success) {
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
			options?: IMicroGraphQLQueryOptions<TQueryVariables>
		): Promise<IMicroGraphQLResult<TData>> => {
			const key = hash({ query, variables: options && options.variables });

			if (!key) {
				throw new MicroGraphQLKeyError(queryKeyError);
			}

			const { skipCache }: IMicroGraphQLQueryOptions<TQueryVariables> = {
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
