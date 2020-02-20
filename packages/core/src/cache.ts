import { objectHash } from './hash';

export interface IMicroGraphQLCacheResult<TValue> {
	data?: TValue;
	success: boolean;
}

export interface IMicroGraphQLCache {
	tryGet<TValue>(
		query: string,
		variables: { [key: string]: unknown } | undefined
	): IMicroGraphQLCacheResult<TValue>;
	trySet<TValue>(
		query: string,
		variables: { [key: string]: unknown } | undefined,
		data?: TValue
	): boolean;
	stringify(): string;
	restore(data: string): void;
	prepareQuery?(query: string): string;
}

export function createCache(): IMicroGraphQLCache {
	let cache: { [key: string]: unknown } = {};

	return {
		tryGet: <TValue>(
			query: string,
			variables: { [key: string]: unknown } | undefined
		): IMicroGraphQLCacheResult<TValue> => {
			const key = objectHash({ query, variables });

			const success = key in cache;
			const data = success ? cache[key] : undefined;

			return {
				data: data as TValue,
				success
			};
		},
		trySet: <TValue>(
			query: string,
			variables: { [key: string]: unknown } | undefined,
			data?: TValue
		): boolean => {
			const key = objectHash({ query, variables });

			cache[key] = data;

			return false;
		},
		stringify(): string {
			return JSON.stringify(cache);
		},
		restore(data: string): void {
			cache = JSON.parse(data);
		}
	};
}
